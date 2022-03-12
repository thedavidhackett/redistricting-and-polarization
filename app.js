Promise.all([d3.json("congressional_districts3.json")])
  .then(ready)
  .catch((err) => {
    console.log(err);
  });

function ready(res) {
  let raw = res[0];
  let mapWidth = 600;
  let mapHeight = 550;

  console.log(raw);
  let states = topojson.feature(raw, raw.objects.states);
  let districts = {
    "00s": topojson.feature(raw, raw.objects.districts_00s),
    "10s": topojson.feature(raw, raw.objects.districts_10s),
  };

  let mapSvg = d3.select("body").select("#congressionalMap");
  mapSvg.attr("viewBox", `0 0 ${mapWidth} ${mapHeight}`);

  let projection = d3
    .geoIdentity()
    .reflectY(true)
    .fitSize([mapWidth, mapHeight], states);

  let path = d3.geoPath().projection(projection);

  let colors = ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"];
  let breaks = [0.2, 0.4, 0.6, 0.8];

  let color = d3.scaleThreshold().domain(breaks).range(colors);

  let getColor = (d) => color(d.properties.score);

  let mapLegend = mapSvg
    .append("text")
    .attr("y", 40)
    .attr("x", 10)
    .style("font-size", "18px")
    .text("Congressional Districts in the 2000's");

  let rectHeight = 20;
  let rectWidth = 60;
  for (let i = 0; i < 5; i++) {
    mapSvg
      .append("rect")
      .attr("x", 10 + i * rectWidth)
      .attr("y", mapHeight - rectHeight - 12)
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .style("fill", colors[i]);
  }

  mapSvg
    .append("text")
    .attr("x", 0)
    .attr("y", mapHeight - rectHeight - 18)
    .style("font-size", "14px")
    .text("More Moderate");

  mapSvg
    .append("text")
    .attr("x", 4 * rectWidth + rectWidth / 2)
    .attr("y", mapHeight - rectHeight - 18)
    .style("font-size", "14px")
    .text("More Extreme");

  mapSvg
    .append("g")
    .selectAll(".state")
    .data(states.features)
    .join("path")
    .attr("d", path)
    .attr("class", "state")
    .style("fill", "none")
    .style("stroke", "#333")
    .style("stroke-width", "0.5")
    .style("pointer-events", "none");

  for (let key in districts) {
    mapSvg
      .append("g")
      .selectAll(`.district.congressionalDistrict-${key}`)
      .data(districts[key].features)
      .join("path")
      .attr("d", path)
      .attr(
        "class",
        (d) =>
          `district congressionalDistrict-${key} ${d.properties.state_abbrev}`
      )
      .attr("data-decade", key)
      .style("fill", getColor)
      .style("stroke", "#333")
      .style("stroke-width", "0.5")
      .style("display", "none");
  }

  const container = d3.select(".scrolly-overlay");
  const stepSel = container.selectAll(".step"); //final all the step nodes

  const repStates = ["Florida", "North Carolina", "Ohio", "Wisconsin"];
  const splitStates = ["Iowa", "Maine", "New Jersey", "Oregon"];
  const courtStates = ["Colorado", "Minnesota", "Nevada", "New Mexico"];
  const legendKey = [
    "Congressional Districts in the 2000's",
    "Congressional Districts in the 2010's",
    "Republican Drawn Districts in Swing States",
    "Split Party Drawn Districts in Swing States",
    "Court Drawn Districts in Swing States",
  ];

  d3.selectAll(".congressionalDistrict-00s").style("display", "block");

  let popup = mapSvg
    .append("g")
    .attr("class", "mouse-over-popup")
    .style("display", "none");

  popup
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 120)
    .attr("height", 40)
    .style("fill", "white");

  popup
    .append("text")
    .attr("class", "district-name")
    .attr("x", 5)
    .attr("y", 15)
    .style("font-size", 12);
  popup
    .append("text")
    .attr("class", "district-score")
    .attr("x", 5)
    .attr("y", 30)
    .style("font-size", 12);

  d3.selectAll(".district")
    .on("mouseover", (event, d) => {
      popup
        .attr(
          "transform",
          `translate(${path.centroid(d)[0] - 60},${path.centroid(d)[1] + 10})`
        )
        .style("display", "block");

      popup
        .select(".district-name")
        .text(
          `District: ${d.properties.state_abbrev}-${d.properties.district_code}`
        );

      popup
        .select(".district-score")
        .text(`Absolute Score: ${d.properties.score.toFixed(3)}`);
    })
    .on("mouseout", (event, d) => {
      popup.style("display", "none");
    });

  function updateChart(index) {
    const sel = container.select(`[data-index='${index}']`);
    const decade = sel.attr("data-decade");

    mapLegend.text(legendKey[index]);

    d3.selectAll(".district").style("display", "none");
    d3.selectAll(`.congressionalDistrict-${decade}`)
      .style("display", "block")
      .style("opacity", 1);
    d3.selectAll(".state").style("stroke", "#333").style("stroke-width", "0.5");

    if (index == 2) {
      d3.selectAll(`.congressionalDistrict-${decade}`)
        .filter((d) => !repStates.includes(d.properties.state_name))
        .style("opacity", 0.25);

      d3.selectAll(".state")
        .filter((d) => repStates.includes(d.properties.NAME))
        .style("stroke", "red")
        .style("stroke-width", "5");
    }

    if (index == 3) {
      d3.selectAll(`.congressionalDistrict-${decade}`)
        .filter((d) => !splitStates.includes(d.properties.state_name))
        .style("opacity", 0.25);

      d3.selectAll(".state")
        .filter((d) => splitStates.includes(d.properties.NAME))
        .style("stroke", "red")
        .style("stroke-width", "5");
    }

    if (index == 4) {
      d3.selectAll(`.congressionalDistrict-${decade}`)
        .filter((d) => !courtStates.includes(d.properties.state_name))
        .style("opacity", 0.25);

      d3.selectAll(".state")
        .filter((d) => courtStates.includes(d.properties.NAME))
        .style("stroke", "red")
        .style("stroke-width", "5");
    }
  }

  function init() {
    enterView({
      //our main view function
      selector: stepSel.nodes(),
      offset: 0.2, //when the slide is 50% away then trigger your chart
      enter: (el) => {
        //what's supposed to happen when the slide enters?
        let index = +d3.select(el).attr("data-index"); //extract the data-index attribute. this can be anything: a filter, a date, whatever.

        updateChart(index);
      },
      exit: (el) => {
        //what's supposed to happen when the slide exits?
        let index = +d3.select(el).attr("data-index");
        index = Math.max(0, index - 1);
        updateChart(index);
      },
    });
  }

  init();
}

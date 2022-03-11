Promise.all([d3.json("congressional_districts3.json")])
  .then(ready)
  .catch((err) => {
    console.log(err);
  });

function ready(res) {
  let raw = res[0];
  let mapWidth = 600;
  let mapHeight = 400;

  console.log(raw);
  let states = topojson.feature(raw, raw.objects.states);
  let districts = {
    "00s": topojson.feature(raw, raw.objects.districts_00s),
    "10s": topojson.feature(raw, raw.objects.districts_10s),
  };

  console.log(districts);

  let mapSvg = d3.select("body").select("#congressionalMap");
  mapSvg.attr("viewBox", `0 0 ${mapWidth} ${mapHeight}`);

  let projection = d3
    .geoIdentity()
    .reflectY(true)
    .fitSize([mapWidth, mapHeight], states);

  let path = d3.geoPath().projection(projection);

  let colors = ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#6a51a3"];
  let breaks = [0, 0.25, 0.5, 0.75];

  let color = d3.scaleThreshold().domain(breaks).range(colors);

  let getColor = (d) => color(d.properties.score);

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
          `district congressionalDistrict-${key} ${d.properties.state_name}`
      )
      .style("fill", getColor)
      .style("stroke", "#333")
      .style("stroke-width", "0.5")
      .style("opacity", "0");
  }

  const container = d3.select(".scrolly-overlay");
  const stepSel = container.selectAll(".step"); //final all the step nodes
  const decadeLegend = d3.select("#decade");

  const repStates = ["Florida", "North Carolina", "Ohio", "Wisconsin"];
  const splitStates = ["Iowa", "Maine", "New Jersey", "Oregon"];
  const courtStates = ["Colorado", "Minnesota", "Nevada", "New Mexico"];
  const legendKey = {
    "00s": "2003-2012",
    "10s": "2013-2022",
  };

  d3.selectAll(".congressionalDistrict-00s").style("opacity", "1");

  function updateChart(index) {
    const sel = container.select(`[data-index='${index}']`);
    const decade = sel.attr("data-decade");
    decadeLegend.html(legendKey[decade]);
    d3.selectAll(".district").style("opacity", "0");
    d3.selectAll(`.congressionalDistrict-${decade}`).style("opacity", "1");
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
      offset: 0.5, //when the slide is 50% away then trigger your chart
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

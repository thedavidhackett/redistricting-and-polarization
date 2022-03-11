library(tidyverse)
library(dbplyr)
library(ggbeeswarm)

raw <- read.csv('data_raw.csv')

data <- raw %>%
  filter(congress > 85, chamber=="House", state_abbrev %in% state.abb)


# Decades
# 80s 98-102
# 90s 103-107
# 00s 108-111
# 10a 113-117


get_state_name <- Vectorize(function(abbr) {
  return (state.name[grep(abbr, state.abb)])
})


grouped_data <- data %>%
  filter(congress >= 108) %>%
  mutate(decade = case_when(congress >= 108 & congress < 113 ~ "00s",
                            congress >= 113 & congress < 118 ~ "10s",
                            TRUE ~ 'other'), dim1_abs = abs(nominate_dim1)) %>%
  group_by(state_abbrev, district_code, decade) %>%
  summarise(avg_score = mean(dim1_abs, na.rm=TRUE)) %>%
  ungroup() %>%
  mutate(state_name = get_state_name(state_abbrev)) %>%
  pivot_wider(id_cols = c('state_name', 'state_abbrev', 'district_code'), names_from = 'decade', values_from = 'avg_score')

write.csv(grouped_data, 'district_avg_nominate_scores.csv')


data_overtime <- data %>%
  filter(!is.na(nominate_dim1)) %>%
  filter(party_code == 100 | party_code == 200) %>%
  group_by(congress) %>%
  summarise(dem_avg = mean(nominate_dim1[party_code == 100]), rep_avg = mean(nominate_dim1[party_code == 200])) %>%
  mutate(year = (congress - 86) * 2 + 1959 )

data_overtime$diff <- data_overtime$rep_avg - data_overtime$dem_avg

pdf("nominate_overtime.pdf")
nominate_overtime <- data_overtime %>%
  ggplot() +
  geom_line(aes(x = year, y = dem_avg, color= "blue")) +
  geom_line(aes(x = year, y = rep_avg, color = "red")) +
  theme_light()+
  theme(legend.position = "None") +
  xlab('Year') +
  ylab('Nominate Score') +
  aes(ymin=-0.5)

nominate_overtime
print(nominate_overtime)
dev.off()

states <- read.csv("redistricting.csv")

data <- data %>%
  mutate(state_name = get_state_name(state_abbrev))
  
data_categorized <- merge(data, states, by.x='state_name', by.y='State')

data_categorized_grouped <- data_categorized %>%
  filter(!is.na(nominate_dim1), congress >= 113) %>%
  group_by(Category) %>%
  summarise(dem_avg = mean(nominate_dim1[party_code == 100]), 
            rep_avg = mean(nominate_dim1[party_code == 200])) 
  
data_categorized_grouped %>%
  ggplot() + 
  geom_pointrange(mapping=aes(x=dem_avg, y=Category, xmin=dem_avg, ymin=rep_avg), 
                  width=0.2, size=1, color="blue", fill="white", shape=22)



pdf("categories.pdf")
data_categorized_grouped %>%
  filter(Category != "N/A") %>%
  ggplot() +
  geom_segment(aes(x=reorder(Category, rep_avg-dem_avg), xend=reorder(Category, rep_avg), 
                   yend=dem_avg, y=rep_avg), color="gray", size=2) +
  geom_point( aes(x=reorder(Category, rep_avg-dem_avg), y=dem_avg),color="blue", size=10 ) +
  geom_point( aes(x=reorder(Category, rep_avg-dem_avg), y=rep_avg),color="red", size=10 ) +
  theme_light()+
  coord_flip()+
  aes(ymin=-0.5) %>%
  print()
dev.off()

data_categorized$cat_dummies <- factor(data_categorized$Category)

summary(lm(abs(nominate_dim1)~cat_dummies, data=data_categorized))

data_categorized %>%
  group_by(Category) %>%
  summarise(count=n()) %>%
  view()

data_categorized %>%
  filter(congress == 117, Category != "N/A") %>%
  mutate(Category = ifelse(Category == "Commision" | Category == "Courts",
                            "Commision/Court", Category)) %>%
  ggplot(aes(x = Category, y = nominate_dim1)) +
  geom_beeswarm() +
  geom_quasirandom()



data_categorized_grouped %>%
  ggplot() +
  geom_bar(stat="Identity", aes(x=reorder(Category, rep_avg), y=dem_avg, fill="blue")) +
  geom_bar(stat="Identity", aes(x=reorder(Category, rep_avg), y=rep_avg, fill="red")) +
  coord_flip()
  
  

raw %>%
  filter(congress >= 113, state_abbrev == "MI", district_code == 10) %>%
  view()



export function getRankFromMMR(mmr: number) {
  if (mmr < 770) return { name: "Herald", iconUrl: "https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_1.png" };
  if (mmr < 1540) return { name: "Guardian", iconUrl: "https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_2.png" };
  if (mmr < 2310) return { name: "Crusader", iconUrl: "https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_3.png" };
  if (mmr < 3080) return { name: "Archon", iconUrl: "https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_4.png" };
  if (mmr < 3850) return { name: "Legend", iconUrl: "https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_5.png" };
  if (mmr < 4620) return { name: "Ancient", iconUrl: "https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_6.png" };
  if (mmr < 5420) return { name: "Divine", iconUrl: "https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_7.png" };
  return { name: "Immortal", iconUrl: "https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_8.png" };
}

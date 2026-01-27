export type Lang = "ja" | "en";

export type ClassProfile = {
  desc: { ja: string; en: string };
  classFlavor: {
    ja: string[];
    en: string[];
  };
};

export const CLASS_PROFILES: Record<string, ClassProfile> = {
  seraphim_healer: {
    desc: {
      ja: "祈りと癒しで前線を支える回復役。味方の小さな変化にも気づき、戦場の空気を整える。",
      en: "A healer who supports the front line with prayer and restoration. You notice subtle shifts and stabilize the battlefield.",
    },
    classFlavor: {
      ja: ["回復は最強のバフ。", "崩れかけた戦線を立て直すのが得意。", "味方の鼓動を読むタイプ。"],
      en: ["Healing is the strongest buff.", "Great at rebuilding a collapsing line.", "You read allies like a heartbeat."],
    },
  },

  torch_enchanter: {
    desc: {
      ja: "灯火に魔力を宿し、仲間の武具や心に火を灯す付与術師。小さな炎が大きな勝ち筋を作る。",
      en: "An enchanter who imbues flame into tools and spirits. Small sparks become decisive win conditions.",
    },
    classFlavor: {
      ja: ["一手先の準備が勝利を呼ぶ。", "火力ではなく勝ち筋を作る。", "味方の長所を伸ばす職人。"],
      en: ["Preparation wins fights.", "Not raw power—creating the win condition.", "A craftsman of allies’ strengths."],
    },
  },

  wind_bard: {
    desc: {
      ja: "風に言葉をのせて仲間を鼓舞する吟遊詩人。空気を変え、流れを引き寄せるムードメーカー。",
      en: "A bard who rides the wind with words. You shift the atmosphere and pull momentum to your side.",
    },
    classFlavor: {
      ja: ["盛り上げて勝つ。", "空気を変えるのが仕事。", "味方の集中をまとめるのが上手い。"],
      en: ["Hype to win.", "Your job is changing the mood.", "Great at aligning the party’s focus."],
    },
  },

  contract_diplomancer: {
    desc: {
      ja: "契約と交渉で戦を終わらせる交渉術師。言葉と条件で敵味方の利害を再配置する。",
      en: "A diplomancer who ends conflicts through contracts. You rearrange incentives with words and terms.",
    },
    classFlavor: {
      ja: ["交渉は最短ルート。", "戦う前に勝つタイプ。", "条件設計で世界を動かす。"],
      en: ["Negotiation is the shortcut.", "You win before the fight.", "You move the world by structuring terms."],
    },
  },

  star_oracle: {
    desc: {
      ja: "星の配置から未来を読む予言者。直感と兆しに強く、危険を未然に避ける判断役。",
      en: "An oracle who reads futures from stars. Strong intuition, avoiding danger before it happens.",
    },
    classFlavor: {
      ja: ["不思議と当たる。", "嫌な予感はだいたい正しい。", "未来の分岐を見て選ぶ。"],
      en: ["You’re oddly accurate.", "Bad vibes are usually right.", "You choose by reading branches of fate."],
    },
  },

  azure_archmage: {
    desc: {
      ja: "蒼天の魔力を操る大魔導。論理と集中で大技を通し、局面を一気に塗り替える。",
      en: "An archmage of the azure sky. You land decisive spells through focus and structure.",
    },
    classFlavor: {
      ja: ["通れば勝ち。", "集中が最大火力。", "仕上げの一撃担当。"],
      en: ["If it lands, you win.", "Focus equals damage.", "You deliver the finishing blow."],
    },
  },

  castle_artificer: {
    desc: {
      ja: "城塞級の防衛・機構を作る工匠。仕組みで守り、仕組みで勝つ。堅実な設計者。",
      en: "An artificer who builds fortress-grade mechanisms. You win by systems and reliable design.",
    },
    classFlavor: {
      ja: ["仕組みが全部を解決する。", "堅実に積み上げる職。", "壊れない勝ち方が好き。"],
      en: ["Systems solve everything.", "You stack steady advantages.", "You prefer unbreakable wins."],
    },
  },

  holy_sigil_paladin: {
    desc: {
      ja: "聖印で誓いを刻む聖騎士。守るために前へ出る。信念でパーティの軸になる。",
      en: "A paladin who inscribes vows with holy sigils. You step forward to protect—becoming the party’s axis.",
    },
    classFlavor: {
      ja: ["守るための前進。", "信念でブレない。", "味方に安心感を配る。"],
      en: ["Advance to protect.", "Unshakable conviction.", "You give the party a sense of safety."],
    },
  },

  travel_ranger: {
    desc: {
      ja: "旅路で鍛えた嗅覚を持つレンジャー。探索・情報・機転に強く、未知の攻略が得意。",
      en: "A ranger with a traveler’s instincts. Strong at scouting, intel, and improvisation in the unknown.",
    },
    classFlavor: {
      ja: ["未知が楽しいタイプ。", "情報で勝つ。", "最短ルートを見つける。"],
      en: ["You enjoy the unknown.", "You win with information.", "You find the fastest route."],
    },
  },

  thunder_rogue: {
    desc: {
      ja: "迅雷のごとく間合いを奪う影盗賊。静と動の切り替えが速く、隙に刺さる。",
      en: "A rogue who steals distance like lightning. Fast switches between stillness and motion—punishing openings.",
    },
    classFlavor: {
      ja: ["一瞬の隙がごちそう。", "静かに勝ち筋を拾う。", "刺すべき時だけ刺す。"],
      en: ["Openings are a feast.", "Quietly collect win conditions.", "Strike only when it matters."],
    },
  },

  training_warlord: {
    desc: {
      ja: "鍛錬で自分と仲間を強くする武王。努力を継続できる推進力で、全員の伸びを作る。",
      en: "A warlord who strengthens the party through training. Your consistency creates growth for everyone.",
    },
    classFlavor: {
      ja: ["努力が裏切らない。", "継続で差をつける。", "勝つまで伸びる。"],
      en: ["Effort pays.", "Consistency creates gaps.", "You grow until you win."],
    },
  },

  immortal_vanguard: {
    desc: {
      ja: "倒れず進む不滅の守護戦士。耐えるだけじゃなく、味方のために押し返す盾になる。",
      en: "An immortal vanguard who keeps moving. Not just enduring—pushing back for the party as a living shield.",
    },
    classFlavor: {
      ja: ["耐える＝勝ちにつながる。", "折れないのが強み。", "味方を守るために押し返す。"],
      en: ["Endurance becomes victory.", "Unbreakable is your strength.", "You push back to protect."],
    },
  },
};

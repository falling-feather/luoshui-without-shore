export const LITERARY_SOURCE = 'https://zh.wikisource.org/wiki/洛神賦';

export const LUOSHEN = [
  { title: '归途 · 流眄洛川', lines: [
    '余从京域，言归东藩。背伊阙，越轘辕，经通谷，陵景山。',
    '日既西倾，车殆马烦。',
    '尔乃税驾乎蘅皋，秣驷乎芝田。',
    '容与乎阳林，流眄乎洛川。',
    '于是精移神骇，忽焉思散，俯则未察，仰以殊观，睹一丽人，于岩之畔。',
    '乃援御者而告之曰：“尔有觌于彼者乎？彼何人斯？若此之艳也？”',
    '御者对曰：“臣闻河洛之神，名曰宓妃。然则君王所见，无乃是乎？其状若何？臣愿闻之。”',
    '余告之曰：其形也，',
  ]},
  { title: '惊鸿 · 远望近察', lines: [
    '翩若惊鸿，婉若游龙。',
    '荣曜秋菊，华茂春松。',
    '髣髴兮若轻云之蔽月，飘颻兮若流风之回雪。',
    '远而望之，皎若太阳升朝霞；迫而察之，灼若芙蕖出渌波。',
    '秾纤得衷，修短合度。肩若削成，腰如约素。',
    '延颈秀项，皓质呈露。芳泽无加，铅华弗御。',
    '云髻峨峨，修眉联娟。丹唇外朗，皓齿内鲜。',
    '明眸善睐，靥辅承权。瑰姿艳逸，仪静体闲。',
    '柔情绰态，媚于语言。奇服旷世，骨像应图。',
    '披罗衣之璀粲兮，珥瑶碧之华琚。戴金翠之首饰，缀明珠以耀躯。',
    '践远游之文履，曳雾绡之轻裾。微幽兰之芳蔼兮，步踟蹰于山隅。',
    '于是忽焉纵体，以遨以嬉。左倚采旄，右荫桂旗。',
    '攘皓腕于神浒兮，采湍濑之玄芝。',
  ]},
  { title: '通辞 · 托微波', lines: [
    '余情悦其淑美兮，心振荡而不怡。',
    '无良媒以接欢兮，托微波而通辞。',
    '愿诚素之先达兮，解玉佩以要之。',
    '嗟佳人之信修，羌习礼而明诗。',
    '抗琼珶以和予兮，指潜渊而为期。',
    '执眷眷之款实兮，惧斯灵之我欺。',
    '感交甫之弃言兮，怅犹豫而狐疑。',
    '收和颜而静志兮，申礼防以自持。',
  ]},
  { title: '凌波 · 进止难期', lines: [
    '于是洛灵感焉，徙倚彷徨，神光离合，乍阴乍阳。',
    '竦轻躯以鹤立，若将飞而未翔。',
    '践椒涂之郁烈，步蘅薄而流芳。',
    '超长吟以永慕兮，声哀厉而弥长。',
    '尔乃众灵杂沓，命俦啸侣，或戏清流，或翔神渚，或采明珠，或拾翠羽。',
    '从南湘之二妃，携汉滨之游女。',
    '叹匏瓜之无匹兮，咏牵牛之独处。',
    '扬轻袿之猗靡兮，翳修袖以延伫。',
    '体迅飞凫，飘忽若神。',
    '凌波微步，罗袜生尘。',
    '动无常则，若危若安。进止难期，若往若还。',
    '转眄流精，光润玉颜。含辞未吐，气若幽兰。',
    '华容婀娜，令我忘餐。',
  ]},
  { title: '长绝 · 人神道殊', lines: [
    '于是屏翳收风，川后静波。',
    '冯夷鸣鼓，女娲清歌。',
    '腾文鱼以警乘，鸣玉鸾以偕逝。',
    '六龙俨其齐首，载云车之容裔。',
    '鲸鲵踊而夹毂，水禽翔而为卫。',
    '于是越北沚，过南冈，纡素领，回清阳。',
    '动朱唇以徐言，陈交接之大纲。',
    '恨人神之道殊兮，怨盛年之莫当。',
    '抗罗袂以掩涕兮，泪流襟之浪浪。',
    '悼良会之永绝兮，哀一逝而异乡。',
    '无微情以效爱兮，献江南之明珰。',
    '虽潜处于太阴，长寄心于君王。',
    '忽不悟其所舍，怅神宵而蔽光。',
  ]},
  { title: '回望 · 足往神留', lines: [
    '于是背下陵高，足往神留，遗情想像，顾望怀愁。',
    '冀灵体之复形，御轻舟而上溯。',
    '浮长川而忘反，思绵绵而增慕。',
    '夜耿耿而不寐，沾繁霜而至曙。',
    '命仆夫而就驾，吾将归乎东路。',
    '揽騑辔以抗策，怅盘桓而不能去。',
  ]},
] as const;

export const CHAPTERS = [
  { id: 'return', name: '归途', numeral: '壹', english: 'THE RETURN', subtitle: '日暮，流眄洛川', verse: [LUOSHEN[0].lines[1], LUOSHEN[0].lines[3]], meaning: '日色向西，车马已倦。一次水岸的停驻，让归途转向一场相逢。', prompt: '滚动或按住方向键，沿水岸行卷。', action: '走近水岸', actionBack: '远望洛川', accent: '#ddbc82', section: 0 },
  { id: 'apparition', name: '惊鸿', numeral: '贰', english: 'THE APPARITION', subtitle: '远望，与近察', verse: [LUOSHEN[1].lines[0], LUOSHEN[1].lines[2]], meaning: '远望是朝霞，近察是芙蕖。她在水与光之间显现，目光使距离有了形状。', prompt: '轻移目光，或凝神近察衣袂与倒影。', action: '凝神近察', actionBack: '退一步相望', accent: '#e9cf93', section: 1 },
  { id: 'message', name: '通辞', numeral: '叁', english: 'WORDS ON WATER', subtitle: '托微波，而通辞', verse: [LUOSHEN[2].lines[1], LUOSHEN[2].lines[2]], meaning: '余以玉佩相邀，洛神举琼珶回应。微波往来，心意相通，身影仍在彼岸。', prompt: '轻触或划过水面，以玉佩之请唤来琼珶之答。', action: '以玉佩相邀', accent: '#b4d6cb', section: 2 },
  { id: 'dance', name: '凌波', numeral: '肆', english: 'DANCE OF THE RIVER', subtitle: '若往，若还', verse: [LUOSHEN[3].lines[9], LUOSHEN[3].lines[10]], meaning: '轻步不留下尘土，留下流动的水纹。她的进与止，在同一刻显得近，又显得远。', prompt: '驻步或再行，观察进止怎样进入水纹。', attentionPrompt: '她驻步，衣袂与余波渐息；水面仍在流动。', action: '驻步观澜', actionBack: '随波再行', accent: '#d4c491', section: 3 },
  { id: 'farewell', name: '长绝', numeral: '伍', english: 'THE PARTING', subtitle: '人神，道殊', verse: [LUOSHEN[4].lines[7], LUOSHEN[4].lines[9]], meaning: '六龙载云车而去。相望曾有回应，相逢仍走向别离；华彩收束，水天渐空。', prompt: '向前行卷，目送离去；回望不会消除距离。', attentionPrompt: '她回眸，云车仍向远处去。', action: '回望离影', actionBack: '目送离去', accent: '#e4bd8b', section: 4 },
  { id: 'memory', name: '回望', numeral: '陆', english: 'WHAT REMAINS', subtitle: '足往，神留', verse: [LUOSHEN[5].lines[3], LUOSHEN[5].lines[5]], meaning: '天将明，归途仍在。相逢已经远去，停留与传辞却成为这一次观看的痕迹。', prompt: '回望已行之境，或在此收卷。', action: '收卷回望', accent: '#c8c7b3', section: 5 },
] as const;
export type ChapterId = typeof CHAPTERS[number]['id'];
export type Chapter = typeof CHAPTERS[number];
export const chapterById = (id: string): Chapter | undefined => CHAPTERS.find(ch => ch.id === id);
export const EXCHANGE = {
  request: { actor:'余', shore:'此岸', symbol:'玉佩', line:LUOSHEN[2].lines[2], phrase:'解玉佩以要之' },
  response: { actor:'洛神', shore:'彼岸', symbol:'琼珶', line:LUOSHEN[2].lines[4], phrase:'抗琼珶以和予' },
} as const;

export const LIBRARY = [
  {
    id: 'luoshen', title: '洛神赋', author: '曹植', era: '曹魏', genre: '辞赋',
    lead: '一场相逢，从暮色写到天明。',
    source: LITERARY_SOURCE, sourceLabel: '维基文库《洛神赋》原文',
    introduction: '黄初三年，余朝京师，还济洛川。古人有言，斯水之神，名曰宓妃。感宋玉对楚王神女之事，遂作斯赋。其辞曰：',
    sections: LUOSHEN,
    note: '正文按原作次序分为六段，段名为本作所拟；采用简体及整理标点，部分异体字作常用字处理。',
  },
  {
    id: 'qiai', title: '七哀诗', author: '曹植', era: '汉魏之际', genre: '五言诗',
    lead: '明月照高楼，流光正徘徊。',
    source: 'https://zh.wikisource.org/zh-hans/七哀詩_(曹子建)', sourceLabel: '维基文库《七哀诗》原文',
    introduction: '月光、高楼与不能会合的尘泥，以思妇的口吻写相隔。',
    sections: [{ title: '原文', lines: ['明月照高楼，流光正徘徊。','上有愁思妇，悲叹有余哀。','借问叹者谁？言是客子妻。','君行逾十年，孤妾常独栖。','君若清路尘，妾若浊水泥。','浮沉各异势，会合何时谐？','愿为西南风，长逝入君怀。','君怀良不开，贱妾当何依？'] }],
    note: '与本作的联系是相望与会合的悬隔；保留思妇独白的原作语境，不将其当作洛神的台词。',
  },
  {
    id: 'yange', title: '燕歌行 · 其一', author: '曹丕', era: '汉魏之际', genre: '七言乐府',
    lead: '星汉西流夜未央，牵牛织女遥相望。',
    source: 'https://zh.wikisource.org/zh-hans/燕歌行_(曹丕)', sourceLabel: '维基文库《燕歌行》原文',
    introduction: '秋风与月夜，琴弦与河梁，构成一场漫长的等待。',
    sections: [{ title: '原文', lines: ['秋风萧瑟天气凉，草木摇落露为霜，','群燕辞归鹄南翔。念君客游思断肠，','慊慊思归恋故乡，君何淹留寄他方！','贱妾茕茕守空房，忧来思君不敢忘。','不觉泪下沾衣裳，援琴鸣弦发清商。','短歌微吟不能长，明月皎皎照我床。','星汉西流夜未央，牵牛织女遥相望。','尔独何辜限河梁？'] }],
    note: '本作以遥相望、月光和阻隔作对读，原诗的游子思妇叙事与《洛神赋》人神相遇的叙事分别保留。',
  },
  {
    id: 'denglou', title: '登楼赋', author: '王粲', era: '东汉末年', genre: '辞赋',
    lead: '虽信美而非吾土兮，曾何足以少留？',
    source: 'https://zh.wikisource.org/zh-hans/登樓賦', sourceLabel: '维基文库《登楼赋》原文',
    introduction: '登高四望，眼前的美景与心中的故乡相隔。',
    sections: [{ title: '登临', lines: ['登兹楼以四望兮，聊暇日以销忧。','览斯宇之所处兮，实显敞而寡仇。','挟清漳之通浦兮，倚曲沮之长洲。','背坟衍之广陆兮，临皋隰之沃流。','北弥陶牧，西接昭丘。','华实蔽野，黍稷盈畴。','虽信美而非吾土兮，曾何足以少留？'] },
      { title: '怀归', lines: ['遭纷浊而迁逝兮，漫逾纪以迄今。','情眷眷而怀归兮，孰忧思之可任？','凭轩槛以遥望兮，向北风而开襟。','平原远而极目兮，蔽荆山之高岑。','路逶迤而修迥兮，川既漾而济深。','悲旧乡之壅隔兮，涕横坠而弗禁。','昔尼父之在陈兮，有归欤之叹音。','钟仪幽而楚奏兮，庄舄显而越吟。','人情同于怀土兮，岂穷达而异心？'] },
      { title: '徘徊', lines: ['惟日月之逾迈兮，俟河清其未极。','冀王道之一平兮，假高衢而骋力。','惧匏瓜之徒悬兮，畏井渫之莫食。','步栖迟以徙倚兮，白日忽其将匿。','风萧瑟而并兴兮，天惨惨而无色。','兽狂顾以求群兮，鸟相鸣而举翼。','原野阒其无人兮，征夫行而未息。','心凄怆以感发兮，意忉怛而憯恻。','循阶除而下降兮，气交愤于胸臆。','夜参半而不寐兮，怅盘桓以反侧。'] }],
    note: '这里的距离通向故乡与时局。延读围绕“眼前景”与“心中所望”的关系展开，不与《洛神赋》的情节拼接。',
  },
] as const;
export type WorkId = typeof LIBRARY[number]['id'];

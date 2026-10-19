import fs from 'node:fs'
import path from 'node:path'

const rows = []
let sort = 391
const add = ({ school, key, program, plan, track = 'science', professional, eligible, site, scheme = key }) => {
  const publicSubjects = track === 'arts' ? ['大学语文', '英语'] : ['高等数学', '英语']
  rows.push({
    id: `b15-${school}-${key}-2026`, school, program, site, eligible,
    public: publicSubjects, professional, plan,
    scheme: `b15-${school}-${scheme}-${track}`, sort: sort++,
  })
}
const split = (base, arts, science) => {
  if (arts) add({ ...base, key: `${base.key}-arts`, plan: arts, track: 'arts' })
  if (science) add({ ...base, key: `${base.key}-science`, plan: science, track: 'science' })
}

const all19 = '农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类、财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类'

// 安徽建筑大学：五个专业、六个培养点记录。
const ahjzuCity = '安徽城市管理职业学院（安徽省合肥市新站区淮海大道300号）'
const ahjzuHuishang = '徽商职业学院（安徽省合肥市蜀山区槽郢路15号）'
add({ school:'ahjzu', key:'electrical-city', program:'电气工程及其自动化', plan:60, professional:['电工基础','模拟电子技术'], eligible:'能源动力与材料大类、电子与信息大类、装备制造大类、交通运输大类', site:ahjzuCity, scheme:'electrical' })
add({ school:'ahjzu', key:'accounting-city', program:'会计学', plan:60, track:'arts', professional:['管理学','会计学基础'], eligible:'财经商贸大类', site:ahjzuCity, scheme:'accounting' })
add({ school:'ahjzu', key:'cs-city', program:'计算机科学与技术', plan:60, professional:['计算机专业基础','C语言程序设计'], eligible:'电子与信息大类、装备制造大类', site:ahjzuCity, scheme:'cs' })
add({ school:'ahjzu', key:'civil-city', program:'土木工程', plan:60, professional:['建筑力学','土木工程施工'], eligible:'土木建筑大类、交通运输大类、能源动力与材料大类、水利大类', site:ahjzuCity, scheme:'civil' })
add({ school:'ahjzu', key:'hr-city', program:'人力资源管理', plan:60, track:'arts', professional:['管理学','人力资源管理概论'], eligible:'公共管理与服务大类、财经商贸大类、旅游大类、教育与体育大类、公安与司法大类', site:ahjzuCity, scheme:'hr' })
add({ school:'ahjzu', key:'accounting-huishang', program:'会计学', plan:50, track:'arts', professional:['管理学','会计学基础'], eligible:'财经商贸大类', site:ahjzuHuishang, scheme:'accounting' })

// 池州学院：十二个专业、十四条文理科/培养点记录。
const czuMain = '池州学院校本部（安徽省池州市贵池区教育园区）'
const czuVoc = '池州职业技术学院（安徽省池州市贵池区建设西路389号）'
const czuPolice = '安徽警官职业学院（安徽省合肥市清溪路78号；安徽省六安市金安区长淮路6号）'
const czuSurvey = '资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、交通运输大类、电子与信息大类'
add({ school:'czu', key:'history', program:'历史学', plan:50, track:'arts', professional:['中国近代史','中国当代史'], eligible:'财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类', site:czuMain })
add({ school:'czu', key:'surveying', program:'测绘工程', plan:50, professional:['测量学','计算机制图基础'], eligible:czuSurvey, site:czuMain })
split({ school:'czu', key:'marketing', program:'市场营销', professional:['市场营销学','管理学原理'], eligible:'农林牧渔大类、土木建筑大类、食品药品与粮食大类、交通运输大类、电子与信息大类、财经商贸大类、旅游大类、文化艺术大类、教育与体育大类、公共管理与服务大类', site:czuMain }, 50, 50)
add({ school:'czu', key:'hr', program:'人力资源管理', plan:100, track:'arts', professional:['人力资源管理概论','管理学原理'], eligible:'食品药品与粮食大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类', site:czuMain })
add({ school:'czu', key:'human-geography', program:'人文地理与城乡规划', plan:50, professional:['园林植物基础','园林规划设计'], eligible:'农林牧渔大类、资源环境与安全大类、土木建筑大类、水利大类、交通运输大类、旅游大类、文化艺术大类', site:czuVoc })
add({ school:'czu', key:'mechanical', program:'机械设计制造及其自动化', plan:100, professional:['机械制图','机械设计基础'], eligible:'装备制造大类、交通运输大类、电子与信息大类、能源动力与材料大类、土木建筑大类、水利大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类', site:czuMain })
add({ school:'czu', key:'electrical', program:'电气工程及其自动化', plan:100, professional:['电路分析基础','电子技术基础'], eligible:czuSurvey, site:czuMain })
add({ school:'czu', key:'electronic-info', program:'电子信息科学与技术', plan:50, professional:['模拟电子技术基础','数字电子技术基础'], eligible:czuSurvey, site:czuMain })
add({ school:'czu', key:'tourism', program:'旅游管理', plan:100, track:'arts', professional:['旅游学概论','导游业务'], eligible:'资源环境与安全大类、农林牧渔大类、财经商贸大类、旅游大类、文化艺术大类、教育与体育大类、公共管理与服务大类', site:czuMain })
add({ school:'czu', key:'ip', program:'知识产权', plan:150, track:'arts', professional:['民法','知识产权法'], eligible:'资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、财经商贸大类、旅游大类、新闻传播大类、公安与司法大类、公共管理与服务大类', site:czuPolice })
add({ school:'czu', key:'network', program:'网络工程', plan:100, professional:['计算机专业基础','C语言程序设计'], eligible:'能源动力与材料大类、电子与信息大类、装备制造大类、交通运输大类、公安与司法大类', site:czuMain })
split({ school:'czu', key:'financial-management', program:'财务管理', professional:['会计学原理','管理学原理'], eligible:'电子与信息大类、财经商贸大类', site:czuMain }, 25, 25)

// 皖西学院：十五个专业。
const wxcMain = '皖西学院校本部（安徽省六安市云露桥西月亮岛）'
const wxcDefense = '安徽国防科技职业学院（安徽省六安市金安区梅山中路56号）'
const wxcBusiness = '财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、资源环境与安全大类、装备制造大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类'
const wxcFinance = '财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、资源环境与安全大类、装备制造大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类'
const wxcLang = '财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类'
const wxcEng = '资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、交通运输大类、电子与信息大类'
add({ school:'wxc', key:'logistics', program:'物流管理', plan:100, track:'arts', professional:['管理学','微观经济学'], eligible:wxcBusiness, site:wxcMain, scheme:'economics-management' })
add({ school:'wxc', key:'ecommerce', program:'电子商务', plan:100, track:'arts', professional:['管理学','市场营销'], eligible:wxcBusiness, site:wxcMain })
add({ school:'wxc', key:'tourism', program:'旅游管理', plan:100, track:'arts', professional:['管理学','旅游学概论'], eligible:'财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、资源环境与安全大类、食品药品与粮食大类、交通运输大类', site:wxcMain })
add({ school:'wxc', key:'finance', program:'金融工程', plan:100, track:'arts', professional:['管理学','微观经济学'], eligible:wxcFinance, site:wxcMain, scheme:'economics-management' })
add({ school:'wxc', key:'news', program:'新闻学', plan:100, track:'arts', professional:['新闻学概论','新闻采访与写作'], eligible:wxcLang, site:wxcMain })
add({ school:'wxc', key:'english', program:'英语', plan:100, track:'arts', professional:['综合英语','翻译'], eligible:wxcLang, site:wxcMain })
add({ school:'wxc', key:'civil', program:'土木工程', plan:100, professional:['工程力学','土木工程施工与组织管理'], eligible:wxcEng, site:wxcMain })
add({ school:'wxc', key:'water', program:'给排水科学与工程', plan:100, professional:['建筑材料','建筑设备'], eligible:wxcEng, site:wxcMain })
add({ school:'wxc', key:'environment', program:'环境科学与工程', plan:100, professional:['环境学基础','环境规划与管理'], eligible:wxcEng, site:wxcMain })
add({ school:'wxc', key:'tcm', program:'中药学', plan:50, professional:['中药学','中药鉴定学'], eligible:'医药卫生大类、资源环境与安全大类、食品药品与粮食大类', site:wxcMain })
add({ school:'wxc', key:'robotics', program:'机器人工程', plan:50, professional:['电路分析基础','工程制图'], eligible:wxcEng, site:wxcDefense })
add({ school:'wxc', key:'mechanical', program:'机械设计制造及其自动化', plan:50, professional:['机械设计基础','机械制图'], eligible:wxcEng, site:wxcDefense })
add({ school:'wxc', key:'electrical', program:'电气工程及其自动化', plan:50, professional:['电路分析基础','电工技术基础'], eligible:wxcEng, site:wxcDefense })
add({ school:'wxc', key:'network', program:'网络工程', plan:50, professional:['计算机网络','C语言程序设计'], eligible:wxcEng, site:wxcDefense })
add({ school:'wxc', key:'smart-vehicle', program:'智能车辆工程', plan:50, professional:['机械基础','汽车构造'], eligible:wxcEng, site:wxcDefense })

// 马鞍山学院：十八个专业、二十六条文理科记录。
const masuSite = '马鞍山学院（安徽省马鞍山市当涂县姑孰镇黄池路8号）'
const masuArt = '专业类：建筑设计类、艺术设计类；专业：工业设计、家具设计与制造、鞋类设计与工艺、包装策划与设计、包装技术与设计、印刷媒体技术、数字印刷技术、印刷技术、印刷图文信息处理、印刷数字图文技术、数字图文信息技术、服装设计与工艺、现代家用纺织品设计、纺织品设计、服装设计、图文信息技术、游戏设计、数字媒体技术、动漫制作技术、图形图像制作、动漫设计与制作、广告媒体开发、数字媒体应用技术、数字图文信息处理技术、出版策划与编辑、电子出版技术、数字出版、广播影视节目制作、数字广播电视技术、影视动画、摄影摄像技术、影视美术、影视照明技术与艺术、电视节目制作、传媒策划与管理、影视灯光艺术、影视多媒体技术、全媒体广告策划与营销、广告策划与营销、会展策划与管理、传播与策划、美术教育、艺术教育'
add({ school:'masu', key:'cs', program:'计算机科学与技术', plan:160, professional:['C语言程序设计','计算机专业基础'], eligible:'电子与信息大类', site:masuSite, scheme:'computing' })
add({ school:'masu', key:'software', program:'软件工程', plan:160, professional:['C语言程序设计','计算机专业基础'], eligible:'电子与信息大类', site:masuSite, scheme:'computing' })
add({ school:'masu', key:'electrical', program:'电气工程及其自动化', plan:160, professional:['电路分析基础','电子技术'], eligible:'资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、交通运输大类、电子与信息大类', site:masuSite })
add({ school:'masu', key:'mechanical', program:'机械设计制造及其自动化', plan:160, professional:['机械制图','机械设计基础'], eligible:'装备制造大类', site:masuSite })
add({ school:'masu', key:'civil', program:'土木工程', plan:120, professional:['土木工程概论','工程力学'], eligible:'交通运输大类、土木建筑大类、资源环境与安全大类、水利大类、装备制造大类、电子与信息大类', site:masuSite })
add({ school:'masu', key:'environment', program:'环境工程', plan:120, professional:['环境工程概论','环境工程生物学'], eligible:'农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类', site:masuSite })
split({ school:'masu', key:'industrial', program:'工业工程', professional:['管理学','计算机专业基础'], eligible:'装备制造大类、交通运输大类、财经商贸大类', site:masuSite }, 40, 40)
split({ school:'masu', key:'health', program:'健康服务与管理', professional:['管理学','人体解剖学'], eligible:'医药卫生大类、生物与化工大类、公共管理与服务大类、食品药品与粮食大类', site:masuSite }, 90, 70)
split({ school:'masu', key:'finance', program:'金融学', professional:['经济学基础','金融学概论'], eligible:'农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、财经商贸大类、旅游大类、公安与司法大类', site:masuSite }, 30, 20)
split({ school:'masu', key:'international-trade', program:'国际经济与贸易', professional:['经济学基础','国际贸易理论与实务'], eligible:'农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、财经商贸大类、旅游大类、教育与体育大类、公安与司法大类、公共管理与服务大类', site:masuSite }, 50, 30)
const masuManagement = '农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类、财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类'
split({ school:'masu', key:'marketing', program:'市场营销', professional:['管理学','市场营销'], eligible:masuManagement, site:masuSite }, 180, 60)
split({ school:'masu', key:'business', program:'工商管理', professional:['管理学','战略管理'], eligible:masuManagement, site:masuSite }, 110, 40)
split({ school:'masu', key:'financial-management', program:'财务管理', professional:['管理学','基础会计（会计学原理）'], eligible:'财经商贸大类', site:masuSite }, 120, 120)
split({ school:'masu', key:'cost', program:'工程造价', professional:['土木工程概论','工程造价管理'], eligible:'农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、财经商贸大类、公安与司法大类、公共管理与服务大类', site:masuSite }, 50, 70)
add({ school:'masu', key:'english', program:'英语', plan:160, track:'arts', professional:['综合英语','英语翻译与写作'], eligible:'财经商贸大类、旅游大类、文化艺术大类、教育与体育大类、公安与司法大类、新闻传播大类、公共管理与服务大类', site:masuSite })
add({ school:'masu', key:'visual', program:'视觉传达设计', plan:90, track:'arts', professional:['艺术概论','创意手绘'], eligible:masuArt, site:masuSite })
add({ school:'masu', key:'digital-art', program:'数字媒体艺术', plan:120, track:'arts', professional:['艺术概论','艺术创作'], eligible:masuArt, site:masuSite })
add({ school:'masu', key:'environment-design', program:'环境设计', plan:30, track:'arts', professional:['艺术概论','造型基础'], eligible:masuArt, site:masuSite })

// 安徽新华学院：十个专业、十一条文理科记录。
const axhuSite = '安徽新华学院（安徽省合肥市高新区望江西路555号）'
const axhuGeneral = '财经商贸大类、医药卫生大类、电子与信息大类、教育与体育大类、装备制造大类、土木建筑大类、交通运输大类、文化艺术大类、旅游大类、公安与司法大类、公共管理与服务大类、食品药品与粮食大类、新闻传播大类、农林牧渔大类、水利大类、能源动力与材料大类、轻工纺织大类、资源环境与安全大类、生物与化工大类'
add({ school:'axhu', key:'cs', program:'计算机科学与技术', plan:320, professional:['计算机专业基础','C语言程序设计'], eligible:axhuGeneral, site:axhuSite })
add({ school:'axhu', key:'chinese', program:'汉语言文学', plan:320, track:'arts', professional:['中国古代文学','现代汉语'], eligible:axhuGeneral, site:axhuSite })
add({ school:'axhu', key:'accounting', program:'会计学', plan:240, track:'arts', professional:['管理学原理','会计学原理'], eligible:axhuGeneral, site:axhuSite })
add({ school:'axhu', key:'preschool', program:'学前教育', plan:220, track:'arts', professional:['学前教育学','学前儿童发展心理学'], eligible:axhuGeneral, site:axhuSite })
add({ school:'axhu', key:'ecommerce', program:'电子商务', plan:120, track:'arts', professional:['管理学原理','市场营销'], eligible:axhuGeneral, site:axhuSite })
add({ school:'axhu', key:'civil', program:'土木工程', plan:120, professional:['工程力学','材料力学'], eligible:axhuGeneral, site:axhuSite })
add({ school:'axhu', key:'electrical', program:'电气工程及其自动化', plan:120, professional:['电路','电子技术基础'], eligible:axhuGeneral, site:axhuSite })
split({ school:'axhu', key:'pharmacy', program:'药学', professional:['药理学','无机化学'], eligible:'医药卫生大类、食品药品与粮食大类、生物与化工大类、能源动力与材料大类-4306非金属材料类、资源环境与安全大类-4208环境保护类、动物药学、中草药栽培与加工技术、茶树栽培与茶叶加工、饲草生产技术、烟草栽培与加工、食用菌生产与加工、绿色食品生产与检验、绿色食品生产技术、农产品贮藏与加工、农产品加工与质量检测、化妆品制造技术、化妆品技术、制浆造纸技术', site:axhuSite }, 90, 90)
add({ school:'axhu', key:'broadcast', program:'播音与主持艺术', plan:60, track:'arts', professional:['播音主持理论','播音主持实务'], eligible:'旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公共管理与服务大类、铁道交通运营管理、高速铁路客运服务、国际邮轮乘务管理、空中乘务、机场运行服务与管理、城市轨道交通运营管理、邮政快递运营管理、网络营销与直播电商、港口与航运管理、高速铁路客运乘务', site:axhuSite })
add({ school:'axhu', key:'visual', program:'视觉传达设计', plan:100, track:'arts', professional:['设计史','专业实践综合'], eligible:'文化艺术大类、新闻传播大类、轻工纺织大类、土木建筑大类、电子与信息大类-5101电子信息类、动漫制作技术、数字媒体技术、移动应用开发、会展策划与管理、工业设计、早期教育、学前教育、小学教育、特殊教育、小学科学教育、美术教育、艺术教育、现代教育技术', site:axhuSite })

// 安徽信息工程学院：七个专业。
const aiitSite = '安徽信息工程学院（安徽省芜湖市湾沚区永和路1号）'
add({ school:'aiit', key:'cs', program:'计算机科学与技术', plan:100, professional:['计算机专业基础','C语言程序设计'], eligible:all19, site:aiitSite })
add({ school:'aiit', key:'automation', program:'自动化', plan:100, professional:['数字电子技术','模拟电子技术基础'], eligible:all19, site:aiitSite })
add({ school:'aiit', key:'mechatronics', program:'机械电子工程', plan:100, professional:['机械设计基础','电工基础'], eligible:all19, site:aiitSite })
add({ school:'aiit', key:'business', program:'工商管理', plan:100, track:'arts', professional:['管理学','综合面试'], eligible:all19, site:aiitSite })
add({ school:'aiit', key:'marketing', program:'市场营销', plan:100, track:'arts', professional:['管理学','市场营销学'], eligible:all19, site:aiitSite })
add({ school:'aiit', key:'supply-chain', program:'供应链管理', plan:50, track:'arts', professional:['管理学','物流与供应链基础'], eligible:all19, site:aiitSite })
add({ school:'aiit', key:'visual', program:'视觉传达设计', plan:50, track:'arts', professional:['设计史','专业实践综合'], eligible:'专业大类：轻工纺织大类、文化艺术大类；专业类：建筑设计类、机械设计制造类、计算机类、广播影视类；专业：美术教育（专业代码570109K）、艺术教育（专业代码570113K）', site:aiitSite })

// 安徽文达信息工程学院：十六个专业、二十二条文理科记录。
const wendaSite = '安徽文达信息工程学院（安徽省合肥市肥西县紫蓬山风景区森林大道3号）'
const wendaArt = '艺术设计类、表演艺术类、民族文化艺术类、文化服务类、建筑设计类、工业设计、家具设计与制造、陶瓷制造技术与工艺、包装工程技术、包装策划与设计、数字图文信息技术、印刷数字图文技术、印刷媒体技术、数字印刷技术、纺织品设计、现代家用纺织品设计、针织技术与针织服装、服装设计与工艺、皮革服装制作与工艺、服装陈列与展示设计、应用电子技术、计算机应用技术、动漫制作技术、数字媒体技术、数字媒体应用技术、虚拟现实应用技术、虚拟现实技术应用、人工智能技术服务、人工智能技术应用、动漫设计与制作、市场营销、广告策划与营销、电子商务、移动商务、网络营销、网络营销与直播电商、跨境电子商务、会展策划与管理、数字图文信息处理技术、出版策划与编辑、数字出版、数字媒体设备应用与管理、影视美术、舞台艺术设计与制作、影视多媒体技术、影视动画、影视照明技术与艺术、音像技术、摄影摄像技术、传播与策划、全媒体广告策划与营销、早期教育、学前教育、小学教育、美术教育、艺术教育、现代教育技术'
const wendaBroadcast = '艺术设计类、表演艺术类、民族文化艺术类、文化服务类、高速铁路客运服务、高速铁路客运乘务、高速铁路动车乘务、国际邮轮乘务管理、空中乘务、城市轨道交通运营管理、导游、酒店管理、酒店管理与数字化运营、休闲服务与管理、葡萄酒文化与营销、会展策划与管理、网络新闻与传播、新闻采编与制作、播音与主持、广播影视节目制作、数字广播电视技术、影视制片管理、影视编导、传播与策划、早期教育、学前教育、小学教育、小学语文教育、语文教育、小学英语教育、英语教育、音乐教育、体育教育、舞蹈教育、艺术教育、特殊教育、社会体育、休闲体育、体育艺术表演、青少年工作与管理、公益慈善事业管理、现代家政服务与管理、家政服务与管理、婚庆服务与管理、陵园服务与管理、影视多媒体技术、摄影摄像技术、音像技术、录音技术与艺术、影视动画、影视照明技术与艺术、纺织品设计、服装设计与工艺、皮革服装制作与工艺、动漫制作技术'
add({ school:'wenda', key:'cs', program:'计算机科学与技术', plan:180, professional:['C语言程序设计','计算机网络基础'], eligible:all19, site:wendaSite, scheme:'computing' })
add({ school:'wenda', key:'software', program:'软件工程', plan:60, professional:['C语言程序设计','计算机网络基础'], eligible:all19, site:wendaSite, scheme:'computing' })
add({ school:'wenda', key:'electronic', program:'电子信息工程', plan:180, professional:['电路分析基础','数字电子技术'], eligible:all19, site:wendaSite, scheme:'electronics' })
add({ school:'wenda', key:'ai', program:'人工智能', plan:60, professional:['电路分析基础','数字电子技术'], eligible:all19, site:wendaSite, scheme:'electronics' })
add({ school:'wenda', key:'new-energy', program:'新能源汽车工程', plan:60, professional:['机械制图','机械设计基础'], eligible:all19, site:wendaSite, scheme:'machinery' })
add({ school:'wenda', key:'smart-manufacturing', program:'智能制造工程', plan:180, professional:['机械制图','机械设计基础'], eligible:all19, site:wendaSite, scheme:'machinery' })
add({ school:'wenda', key:'robotics', program:'机器人工程', plan:120, professional:['机械制图','机械设计基础'], eligible:all19, site:wendaSite, scheme:'machinery' })
split({ school:'wenda', key:'landscape', program:'风景园林', professional:['园林工程项目管理','园林设计'], eligible:all19, site:wendaSite }, 70, 50)
split({ school:'wenda', key:'cost', program:'工程造价', professional:['土木工程概论','工程项目管理'], eligible:all19, site:wendaSite }, 70, 50)
split({ school:'wenda', key:'accounting', program:'会计学', professional:['管理学原理','会计学基础'], eligible:all19, site:wendaSite }, 260, 40)
split({ school:'wenda', key:'ecommerce', program:'电子商务', professional:['管理学原理','市场营销学'], eligible:all19, site:wendaSite, scheme:'marketing' }, 45, 15)
split({ school:'wenda', key:'marketing', program:'市场营销', professional:['管理学原理','市场营销学'], eligible:all19, site:wendaSite, scheme:'marketing' }, 100, 20)
split({ school:'wenda', key:'business-english', program:'商务英语', professional:['商务英语听说','综合商务英语'], eligible:all19, site:wendaSite }, 45, 15)
add({ school:'wenda', key:'animation', program:'动画', plan:180, track:'arts', professional:['卡通造型设计','装饰画设计'], eligible:wendaArt, site:wendaSite })
add({ school:'wenda', key:'visual', program:'视觉传达设计', plan:80, track:'arts', professional:['字体设计','装饰画设计'], eligible:wendaArt, site:wendaSite })
add({ school:'wenda', key:'broadcast', program:'播音与主持艺术', plan:120, track:'arts', professional:['传播学概论','专业实践综合'], eligible:wendaBroadcast, site:wendaSite })

if (rows.length !== 101) throw new Error(`Expected 101 rows, got ${rows.length}`)
if (rows.reduce((sum, row) => sum + row.plan, 0) !== 9350) throw new Error('Plan total mismatch')

const schools = ['ahjzu','czu','wxc','masu','axhu','aiit','wenda']
const quotedSchools = schools.map((slug) => `'${slug}'`).join(',')
const urls = [
  ['ahjzu','https://www.ahjzu.edu.cn/zsw/2026/0204/c2435a263781/page.htm','https://www.ahjzu.edu.cn/zsw/2026/0204/c2435a263781/page.htm'],
  ['czu','https://zs.czu.edu.cn/info/1008/1745.htm','https://zs.czu.edu.cn/info/1004/1711.htm'],
  ['wxc','https://zsb.wxc.edu.cn/2026/0319/c270a211177/page.htm','https://zsb.wxc.edu.cn/2025/1208/c270a208230/page.htm'],
  ['masu','https://zs.masu.edu.cn/2026/0318/c168a75656/page.htm','https://zs.masu.edu.cn/2025/1029/c167a71330/page.htm'],
  ['axhu','https://zhaosheng.axhu.edu.cn/contents/2685/261780.html','https://zhaosheng.axhu.edu.cn/contents/2685/257592.html'],
  ['aiit','https://zsxx.aiit.edu.cn/info/182584','https://zsxx.aiit.edu.cn/info/179795'],
  ['wenda','https://www.wenda.edu.cn/zs/display_34105.html','https://www.wenda.edu.cn/zs/display_34105.html'],
]
const expected = [
  ['ahjzu',6,5,350], ['czu',14,12,1000], ['wxc',15,15,1200],
  ['masu',26,18,2400], ['axhu',11,10,1800], ['aiit',7,7,600], ['wenda',22,16,2000],
]

const sql = `-- Complete the verified 2026 professional study maps for batch fifteen.
-- This migration replaces only the seven target schools' published 2026 offerings.
-- All syllabus points, resources, draft/inactive rows, and non-target offerings are frozen.

create temporary table batch_fifteen_protected_offering_drafts on commit drop as
select to_jsonb(o) as row_data from public.admission_offerings o where o.status <> 'published' or o.active = false;

create temporary table batch_fifteen_protected_points on commit drop as
select to_jsonb(p) as row_data from public.syllabus_points p;

create temporary table batch_fifteen_protected_resources on commit drop as
select to_jsonb(r) as row_data from public.resources r;

create temporary table batch_fifteen_protected_other_offerings on commit drop as
select to_jsonb(o) as row_data from public.admission_offerings o
where not (o.year = 2026 and o.status = 'published' and o.active = true and o.school_slug in (${quotedSchools}));

do $$
begin
  if (select count(*) from batch_fifteen_protected_offering_drafts) <> 4
     or (select count(*) from batch_fifteen_protected_points where row_data->>'status' <> 'published' or (row_data->>'active')::boolean = false) <> 33
     or (select count(*) from batch_fifteen_protected_resources where row_data->>'status' <> 'published') <> 0 then
    raise exception 'Batch fifteen stopped: protected draft/inactive baseline changed';
  end if;
  if (select version from public.content_versions where id = 'public-content') <> 119
     or (select count(*) from public.admission_offerings where status = 'published' and active = true) <> 367
     or (select count(*) from public.syllabus_points where status = 'published' and active = true) <> 1033
     or (select count(*) from public.resources where status = 'published') <> 80 then
    raise exception 'Batch fifteen stopped: production baseline changed';
  end if;
  if (select count(*) from public.admission_offerings where year = 2026 and status = 'published' and active = true and school_slug in (${quotedSchools})) <> 7 then
    raise exception 'Batch fifteen stopped: target offering baseline changed';
  end if;
end $$;

delete from public.admission_offerings
where year = 2026 and status = 'published' and active = true and school_slug in (${quotedSchools});

with source as (
  select * from jsonb_to_recordset($offerings$${JSON.stringify(rows)}$offerings$::jsonb)
    as x(id text, school text, program text, site text, eligible text, public jsonb, professional jsonb, plan integer, scheme text, sort integer)
), source_urls(school, charter_url, syllabus_url) as (
  values
${urls.map((row) => `    ('${row[0]}','${row[1]}','${row[2]}')`).join(',\n')}
)
insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, program_names, exam_scheme_id,
  training_site, eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
)
select source.id, 2026, 'anhui', 'all-programs', source.school, array[source.program], source.scheme,
  source.site, source.eligible,
  array(select jsonb_array_elements_text(source.public)),
  array(select jsonb_array_elements_text(source.professional)),
  source.plan, source_urls.charter_url, source_urls.syllabus_url,
  '2026招生章程与专业课考试大纲已核验', date '2026-10-19', true, 'published', source.sort
from source join source_urls using (school);

do $$
declare
  target record;
  actual_rows integer;
  actual_programs integer;
  actual_plans integer;
begin
  for target in
    select * from (values
${expected.map((row) => `    ('${row[0]}',${row[1]},${row[2]},${row[3]})`).join(',\n')}
    ) as expected(school_slug, offering_rows, program_count, plan_total)
  loop
    select count(*), count(distinct program_name), sum(plan_count)
      into actual_rows, actual_programs, actual_plans
    from (
      select o.plan_count, unnest(o.program_names) as program_name
      from public.admission_offerings o
      where o.year = 2026 and o.status = 'published' and o.active = true and o.school_slug = target.school_slug
    ) expanded;
    if actual_rows <> target.offering_rows or actual_programs <> target.program_count or actual_plans <> target.plan_total then
      raise exception 'Batch fifteen stopped: % totals are %, %, %, expected %, %, %', target.school_slug,
        actual_rows, actual_programs, actual_plans, target.offering_rows, target.program_count, target.plan_total;
    end if;
  end loop;

  if exists (
    (select row_data from batch_fifteen_protected_offering_drafts except select to_jsonb(o) from public.admission_offerings o where o.status <> 'published' or o.active = false)
    union all
    (select to_jsonb(o) from public.admission_offerings o where o.status <> 'published' or o.active = false except select row_data from batch_fifteen_protected_offering_drafts)
  ) then raise exception 'Batch fifteen stopped: protected draft/inactive offerings changed'; end if;

  if exists (
    (select row_data from batch_fifteen_protected_points except select to_jsonb(p) from public.syllabus_points p)
    union all
    (select to_jsonb(p) from public.syllabus_points p except select row_data from batch_fifteen_protected_points)
  ) then raise exception 'Batch fifteen stopped: syllabus points changed'; end if;

  if exists (
    (select row_data from batch_fifteen_protected_resources except select to_jsonb(r) from public.resources r)
    union all
    (select to_jsonb(r) from public.resources r except select row_data from batch_fifteen_protected_resources)
  ) then raise exception 'Batch fifteen stopped: resources changed'; end if;

  if exists (
    (select row_data from batch_fifteen_protected_other_offerings except
     select to_jsonb(o) from public.admission_offerings o where not (o.year = 2026 and o.status = 'published' and o.active = true and o.school_slug in (${quotedSchools})))
    union all
    (select to_jsonb(o) from public.admission_offerings o where not (o.year = 2026 and o.status = 'published' and o.active = true and o.school_slug in (${quotedSchools}))
     except select row_data from batch_fifteen_protected_other_offerings)
  ) then raise exception 'Batch fifteen stopped: non-target offerings changed'; end if;

  if (select count(*) from public.admission_offerings where status = 'published' and active = true) <> 461
     or (select count(distinct school_slug) from public.admission_offerings where status = 'published' and active = true) <> 41
     or (select count(*) from public.admission_offerings where year = 2026 and status = 'published' and active = true and school_slug in (${quotedSchools})) <> 101
     or (select sum(plan_count) from public.admission_offerings where year = 2026 and status = 'published' and active = true and school_slug in (${quotedSchools})) <> 9350 then
    raise exception 'Batch fifteen stopped: published offering totals are incorrect';
  end if;

  if exists (
    select 1 from public.admission_offerings o
    where o.year = 2026 and o.status = 'published' and o.active = true and o.school_slug in (${quotedSchools})
      and (cardinality(o.program_names) <> 1 or o.exam_scheme_id is null or o.plan_count is null or o.training_site is null
        or o.eligible_major_categories is null or cardinality(o.public_subjects) <> 2 or cardinality(o.professional_subjects) <> 2
        or o.charter_url is null or o.syllabus_url is null)
  ) then raise exception 'Batch fifteen stopped: an offering is incomplete or combines programs'; end if;

  if exists (
    select 1 from public.admission_offerings o
    where o.year = 2026 and o.status = 'published' and o.active = true and o.school_slug in (${quotedSchools})
    group by o.school_slug, o.exam_scheme_id
    having count(distinct jsonb_build_array(o.public_subjects, o.professional_subjects)::text) <> 1
  ) then raise exception 'Batch fifteen stopped: different exam subjects share one scheme'; end if;

  if exists (
    select 1 from public.admission_offerings o
    where o.year = 2026 and o.status = 'published' and o.active = true and o.school_slug in (${quotedSchools})
    group by o.school_slug, o.public_subjects, o.professional_subjects
    having count(distinct o.exam_scheme_id) <> 1
  ) then raise exception 'Batch fifteen stopped: identical exam schemes were duplicated'; end if;

  if (select count(*) from public.syllabus_points where status = 'published' and active = true) <> 1033
     or (select count(*) from public.resources where status = 'published') <> 80
     or (select count(*) from public.syllabus_points where status = 'draft' and active = false) <> 33
     or (select count(*) from public.admission_offerings where year = 2027 and status = 'draft' and active = false) <> 4 then
    raise exception 'Batch fifteen stopped: frozen content counts changed';
  end if;

  if (select version from public.content_versions where id = 'public-content') <= 119 then
    raise exception 'Batch fifteen stopped: public content version was not advanced';
  end if;
end $$;
`

const output = path.join(process.cwd(), 'supabase', 'migrations', '20261019104817_complete_batch_fifteen_professional_maps_2026.sql')
fs.writeFileSync(output, sql, 'utf8')
console.log(JSON.stringify({ output, rows: rows.length, plans: rows.reduce((sum, row) => sum + row.plan, 0), schemes: new Set(rows.map((row) => `${row.school}:${row.scheme}`)).size }, null, 2))

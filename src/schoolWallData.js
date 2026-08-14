const detailedLinks = {
  '合肥师范学院': '/anhui/2026/computer-science/hfnu',
  '安徽信息工程学院': '/anhui/2026/computer-science/aiit',
  '安徽文达信息工程学院': '/anhui/2026/computer-science/wenda',
}

const localLogos = {
  '安徽工业大学': '/school-wall/anhui-university-of-technology.webp',
  '安徽农业大学': '/school-wall/anhui-agricultural-university.webp',
  '安徽医科大学': '/school-wall/anhui-medical-university.webp',
  '安徽师范大学': '/school-wall/anhui-normal-university.webp',
  '安徽中医药大学': '/school-wall/anhui-university-of-chinese-medicine.webp',
  '阜阳师范大学': '/school-wall/fuyang-normal-university.webp',
  '安庆师范大学': '/school-wall/anqing-normal-university.webp',
  '安徽建筑大学': '/school-wall/anhui-jianzhu-university.webp',
  '蚌埠学院': '/school-wall/bengbu-university.webp',
  '蚌埠医科大学': '/school-wall/bengbu-medical-university.webp',
  '合肥大学': '/school-wall/hefei-university.webp',
  '巢湖学院': '/school-wall/chaohu-university.webp',
  '亳州学院': '/school-wall/bozhou-university.webp',
  '滁州学院': '/school-wall/chuzhou-university.webp',
  '宿州学院': '/school-wall/suzhou-university.webp',
  '黄山学院': '/school-wall/huangshan-university.webp',
  '池州学院': '/school-wall/chizhou-university.webp',
  '皖西学院': '/school-wall/west-anhui-university.webp',
  '淮南师范学院': '/school-wall/huainan-normal-university.webp',
  '合肥师范学院': '/schools/school-hfnu.jpg',
  '安徽艺术学院': '/school-wall/anhui-university-of-arts.webp',
  '安徽三联学院': '/school-wall/anhui-sanlian-college.webp',
  '芜湖学院': '/school-wall/wuhu-university.webp',
  '安徽财经大学': '/school-wall/anhui-university-of-finance--economics.webp',
  '安徽职业技术大学': '/school-wall/anhui-vocational-and-technical-college.webp',
  '安徽信息工程学院': '/schools/school-aiit.png',
  '安徽文达信息工程学院': '/schools/school-wenda.jpg',
}

const schoolNames = [
  '安徽工业大学', '安徽农业大学', '安徽医科大学', '安徽师范大学', '安徽中医药大学',
  '阜阳师范大学', '安庆师范大学', '安徽建筑大学', '安徽科技学院', '铜陵学院',
  '蚌埠学院', '蚌埠医科大学', '皖南医科大学', '合肥大学', '巢湖学院',
  '亳州学院', '滁州学院', '宿州学院', '黄山学院', '池州学院', '皖西学院',
  '淮南师范学院', '合肥师范学院', '安徽艺术学院', '安徽医科大学临床医学院',
  '马鞍山学院', '安徽新华学院', '合肥经济学院', '合肥城市学院', '安徽外国语学院',
  '安徽三联学院', '蚌埠工商学院', '安徽信息工程学院', '淮北理工学院', '皖江工学院',
  '安徽文达信息工程学院', '芜湖学院', '阜阳理工学院', '安徽财经大学',
  '安徽第二医学院', '安徽职业技术大学', '芜湖职业技术大学',
]

/**
 * 首页院校墙的唯一配置入口。
 * logo 可替换成学校官网发布的透明 PNG / SVG；为空时显示文字校徽兜底。
 */
export const anhuiAdmissionSchools = schoolNames.map((name, index) => ({
  id: `anhui-school-${String(index + 1).padStart(2, '0')}`,
  name,
  logo: localLogos[name] || '',
  href: detailedLinks[name] || '/anhui#school-filter',
  hasDetails: Boolean(detailedLinks[name]),
  shortName: name
    .replace('安徽', '')
    .replace('合肥', '')
    .replace('大学', '')
    .replace('学院', '')
    .slice(0, 2) || '皖',
}))

export function mergeSchoolLogos(logoRows = []) {
  const remoteLogos = new Map(logoRows.map((row) => [row.school_id, row.logo_url]))
  return anhuiAdmissionSchools.map((school) => ({
    ...school,
    logo: remoteLogos.get(school.id) || school.logo,
    logoSource: remoteLogos.has(school.id) ? 'database' : school.logo ? 'local' : 'missing',
  }))
}

export function createSchoolWallTracks(schools = anhuiAdmissionSchools) {
  return [schools.slice(0, 14), schools.slice(14, 28), schools.slice(28)]
}

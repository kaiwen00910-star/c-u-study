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

const shortNames = [
  '工业', '农业', '医科', '师范', '中医', '阜阳', '安庆', '建筑', '科技', '铜陵',
  '蚌埠', '蚌医', '皖医', '合大', '巢湖', '亳州', '滁州', '宿州', '黄山', '池州',
  '皖西', '淮南', '合师', '艺术', '临床', '马鞍', '新华', '经济', '城市', '外语',
  '三联', '工商', '安信', '淮北', '皖江', '文达', '芜湖', '阜阳', '财经', '二医',
  '安职', '芜职',
]

const detailedSchools = {
  23: { school_slug: 'hfnu', school_type: '公办', theme_color: '#0869a6' },
  33: { school_slug: 'aiit', school_type: '民办', theme_color: '#164d89' },
  36: { school_slug: 'wenda', school_type: '民办', theme_color: '#173d78' },
}

const privateSchoolNumbers = new Set([25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38])

/**
 * Supabase 读取失败时使用的完整院校快照。
 * 顺序、ID 和本地校徽与数据库迁移保持一致，避免离线回退改变首页三行校徽墙。
 */
export const fallbackAcademicSchools = schoolNames.map((schoolName, index) => {
  const order = index + 1
  const schoolId = `anhui-school-${String(order).padStart(2, '0')}`
  const detail = detailedSchools[order]
  return {
    school_id: schoolId,
    school_slug: detail?.school_slug || schoolId,
    school_name: schoolName,
    school_type: detail?.school_type || (privateSchoolNumbers.has(order) ? '民办' : '公办'),
    short_name: shortNames[index],
    theme_color: detail?.theme_color || '#1556a6',
    logo_url: localLogos[schoolName] || null,
    sort_order: order,
    active: true,
    has_study_map: Boolean(detail),
  }
})

export function createSchoolWallSchools(schools = fallbackAcademicSchools) {
  return schools
    .filter((school) => school.active !== false)
    .sort((a, b) => a.sort_order - b.sort_order || a.school_id.localeCompare(b.school_id))
    .map((school) => ({
      id: school.school_id,
      name: school.school_name,
      shortName: school.short_name,
      logo: school.logo_url || '',
      logoSource: school.logo_url?.startsWith('https://') ? 'database' : school.logo_url ? 'local' : 'missing',
      href: school.has_study_map ? `/anhui/2026/computer-science/${school.school_slug}` : '/anhui#school-filter',
      hasDetails: Boolean(school.has_study_map),
    }))
}

export const anhuiAdmissionSchools = createSchoolWallSchools()

export function createSchoolWallTracks(schools = anhuiAdmissionSchools) {
  return [schools.slice(0, 14), schools.slice(14, 28), schools.slice(28)]
}

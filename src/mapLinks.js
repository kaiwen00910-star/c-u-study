const AMAP_SEARCH_URL = 'https://uri.amap.com/search'
const MAP_LINK_SOURCE = '安徽升本导航'
const PLACEHOLDER_LOCATIONS = new Set([
  '0',
  'n/a',
  'na',
  'null',
  'undefined',
  '不详',
  '以学校通知为准',
  '以院校公布为准',
  '地址待公布',
  '待公布',
  '待定',
  '未知',
  '暂无',
  '暂无信息',
  '暂无地址',
  '无',
  '校区待定',
  '未公布',
])

function normalizeSearchPart(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanLocationLabel(value) {
  return normalizeSearchPart(value)
    .replace(/^(?:或|、|；|;)+/u, '')
    .replace(/^[^：:]{1,30}[：:](?=.+(?:大学|学院|学校|校区))/u, '')
    .trim()
}

function campusDisplayLabel(baseLabel, campusLabel) {
  const campus = cleanLocationLabel(campusLabel)
  if (/(?:大学|学院|学校)/u.test(campus)) return campus
  const partnerSchool = baseLabel.match(/与(.+)联合培养$/u)?.[1]
  if (partnerSchool) return `${partnerSchool}${campus}`
  return `${baseLabel.replace(/校本部$/u, '')}${campus}`
}

function completeAddressFragment(fragment, previousAddress) {
  const address = normalizeSearchPart(fragment)
  if (!previousAddress || /^(?:[^省]{1,12}省|北京市|上海市|天津市|重庆市)/u.test(address)) return address
  if (/^\d+号/u.test(address)) return `${previousAddress.replace(/\d+号.*$/u, '')}${address}`

  const provinceAndCity = previousAddress.match(/^(.+?省.+?市)/u)?.[1]
  if (provinceAndCity && /^[^市]{1,12}[区县]/u.test(address)) return `${provinceAndCity}${address}`

  const province = previousAddress.match(/^(.+?省)/u)?.[1]
  if (province && /^[^省]{1,12}市/u.test(address)) return `${province}${address}`
  return address
}

function addressDisplayLabel(baseLabel, address, index) {
  const shortAddress = address.replace(/^.*[省市区县]/u, '').trim()
  return `${baseLabel}${shortAddress ? `${shortAddress}校址` : `校址 ${index + 1}`}`
}

function unnamedAddressParts(details) {
  const sections = details
    .split(/[；;]/u)
    .map((part) => part.trim())
    .filter((part) => part && !/^(?:具体校区|章程)/u.test(part))

  return sections.flatMap((section) => {
    const abbreviatedAddresses = section.split('、').map((part) => part.trim()).filter(Boolean)
    const isSingleCampusDoorNumberList = abbreviatedAddresses.length > 1
      && abbreviatedAddresses.slice(1).every((part) => /^\d+号$/u.test(part))
    return abbreviatedAddresses.length > 1
      && !isSingleCampusDoorNumberList
      && abbreviatedAddresses.every((part) => /\d+号/u.test(part))
      ? abbreviatedAddresses
      : [section]
  })
}

export function trainingSiteAssignmentNote(trainingSite) {
  const source = normalizeSearchPart(trainingSite)
  return source.match(/(?:章程未按专业区分[^；;（）]*|具体校区以学校安排为准)/u)?.[0] || ''
}

export function parseTrainingSiteLocations(trainingSite) {
  const source = normalizeSearchPart(trainingSite)
  if (!source) return []

  const parentheticalParts = [...source.matchAll(/([^（）]+)（([^（）]*)）/gu)]
  if (parentheticalParts.length > 1) {
    const firstLabel = cleanLocationLabel(parentheticalParts[0][1])
    const sharedSchool = firstLabel.match(/^(.+?(?:大学|学院|学校))/u)?.[1] || ''
    return parentheticalParts.map((part) => {
      const rawLabel = cleanLocationLabel(part[1])
      const label = sharedSchool && !/(?:大学|学院|学校)/u.test(rawLabel) ? `${sharedSchool}${rawLabel}` : rawLabel
      return { label, searchLocation: `${label}（${part[2].trim()}）` }
    })
  }

  const openingIndex = source.indexOf('（')
  const closingIndex = source.lastIndexOf('）')
  if (openingIndex > 0 && closingIndex > openingIndex) {
    const baseLabel = cleanLocationLabel(source.slice(0, openingIndex))
    const details = source.slice(openingIndex + 1, closingIndex)
    const namedCampuses = details.split(/[；;]/u).map((part) => part.trim()).map((part) => {
      const separatorIndex = part.search(/[：:]/u)
      if (separatorIndex <= 0) return null
      const campus = cleanLocationLabel(part.slice(0, separatorIndex))
      const address = part.slice(separatorIndex + 1).trim()
      if (!campus || !address || /^(?:具体校区|章程)/u.test(campus)) return null
      return {
        label: campusDisplayLabel(baseLabel, campus),
        searchLocation: `${baseLabel} ${campus}（${address}）`,
      }
    }).filter(Boolean)
    if (namedCampuses.length) return namedCampuses

    const addressParts = unnamedAddressParts(details)
    if (addressParts.length > 1) {
      let previousAddress = ''
      return addressParts.map((part, index) => {
        const address = completeAddressFragment(part, previousAddress)
        previousAddress = address
        return {
          label: addressDisplayLabel(baseLabel, address, index),
          searchLocation: `${baseLabel}（${address}）`,
        }
      })
    }
    return [{ label: baseLabel, searchLocation: source }]
  }

  return [{ label: cleanLocationLabel(source), searchLocation: source }]
}

export function hasValidMapLocation(trainingSite) {
  const location = normalizeSearchPart(trainingSite)
  if (location.length < 2 || /^[\s\-—–/\\·.。]+$/u.test(location)) return false
  return !PLACEHOLDER_LOCATIONS.has(location.toLocaleLowerCase('zh-CN'))
}

export function buildAmapSearchKeyword({ schoolName, trainingSite }) {
  const school = normalizeSearchPart(schoolName)
  const location = normalizeSearchPart(trainingSite)
  if (!school || !hasValidMapLocation(location)) return null
  return location.includes(school) ? location : `${school} ${location}`
}

export function buildAmapSearchUrl(details) {
  const keyword = buildAmapSearchKeyword(details)
  if (!keyword) return null
  return `${AMAP_SEARCH_URL}?keyword=${encodeURIComponent(keyword)}&src=${encodeURIComponent(MAP_LINK_SOURCE)}&callnative=0`
}

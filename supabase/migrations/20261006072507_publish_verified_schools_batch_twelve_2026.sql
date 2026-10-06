-- Publish the verified 2026 school-first maps for batch twelve.
-- 安徽第二医学院 is intentionally excluded while its official site is under maintenance.
-- This migration changes schools and admission offerings only; syllabus points and resources are frozen.
-- Draft/inactive rows are snapshotted as JSONB and compared field-by-field before commit.

create temporary table batch_twelve_protected_offering_drafts on commit drop as
select to_jsonb(o) as row_data
from public.admission_offerings o
where o.status <> 'published' or o.active = false;

create temporary table batch_twelve_protected_point_drafts on commit drop as
select to_jsonb(p) as row_data
from public.syllabus_points p
where p.status <> 'published' or p.active = false;

create temporary table batch_twelve_protected_resource_drafts on commit drop as
select to_jsonb(r) as row_data
from public.resources r
where r.status <> 'published';

do $$
begin
  if (select count(*) from batch_twelve_protected_offering_drafts) <> 4
     or (select count(*) from batch_twelve_protected_point_drafts) <> 33
     or (select count(*) from batch_twelve_protected_resource_drafts) <> 0 then
    raise exception 'Batch twelve stopped: protected draft/inactive baseline changed';
  end if;
  if (select version from public.content_versions where id = 'public-content') <> 107
     or (select count(*) from public.admission_offerings where status = 'published') <> 132
     or (select count(*) from public.syllabus_points where status = 'published') <> 1033
     or (select count(*) from public.resources where status = 'published') <> 80 then
    raise exception 'Batch twelve stopped: production baseline changed';
  end if;
  if exists (
    select 1 from public.admission_offerings
    where school_slug in ('anhui-school-29','anhui-school-32','anhui-school-40','anhui-school-42')
  ) or exists (
    select 1 from public.syllabus_points
    where school_slug in ('anhui-school-29','anhui-school-32','anhui-school-40','anhui-school-42')
  ) then
    raise exception 'Batch twelve stopped: target placeholder slugs already have academic content';
  end if;
end $$;

update public.academic_schools
set school_slug = case wall_school_id
    when 'anhui-school-29' then 'cuhf'
    when 'anhui-school-32' then 'bctb'
    when 'anhui-school-42' then 'whit'
  end,
  has_study_map = true
where wall_school_id in ('anhui-school-29','anhui-school-32','anhui-school-42');

with source as (
  select * from jsonb_to_recordset($offerings$[{"id":"b12-cuhf-civil-2026","school":"cuhf","program":"土木工程","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、交通运输大类、旅游大类、教育与体育大类、公共管理与服务大类、文化艺术大类","public":["高等数学","英语"],"professional":["工程力学","建筑施工技术"],"plan":100,"scheme":"cuhf-civil","sort":133},{"id":"b12-cuhf-safety-2026","school":"cuhf","program":"安全工程","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["高等数学","英语"],"professional":["安全管理学","安全系统工程"],"plan":100,"scheme":"cuhf-safety","sort":134},{"id":"b12-cuhf-inorganic-material-2026","school":"cuhf","program":"无机非金属材料工程","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["高等数学","英语"],"professional":["无机化学","建筑材料"],"plan":160,"scheme":"cuhf-inorganic-material","sort":135},{"id":"b12-cuhf-visual-design-2026","school":"cuhf","program":"视觉传达设计","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类中建筑设计类（4401）和城乡规划与管理类（4402），文化艺术大类中艺术设计类（5501）、民族文化艺术类（5503）和文化服务类（5504），新闻传播大类中广播影视类（5602）、动漫制作技术、数字媒体技术、印刷数字图文技术、美术教育、民族美术、艺术教育","public":["大学语文","英语"],"professional":["设计史","专业实践综合"],"plan":120,"scheme":"cuhf-design-practice","sort":136},{"id":"b12-cuhf-environment-design-2026","school":"cuhf","program":"环境设计","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类中建筑设计类（4401）和城乡规划与管理类（4402），文化艺术大类中艺术设计类（5501）、民族文化艺术类（5503）和文化服务类（5504），新闻传播大类中广播影视类（5602）、动漫制作技术、数字媒体技术、印刷数字图文技术、美术教育、民族美术、艺术教育","public":["大学语文","英语"],"professional":["设计史","专业实践综合"],"plan":80,"scheme":"cuhf-design-practice","sort":137},{"id":"b12-cuhf-industrial-design-arts-2026","school":"cuhf","program":"工业设计","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["大学语文","英语"],"professional":["工业设计概论","设计心理学"],"plan":60,"scheme":"cuhf-industrial-design-arts","sort":138},{"id":"b12-cuhf-industrial-design-science-2026","school":"cuhf","program":"工业设计","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["高等数学","英语"],"professional":["工业设计概论","设计心理学"],"plan":100,"scheme":"cuhf-industrial-design-science","sort":139},{"id":"b12-cuhf-mechanical-2026","school":"cuhf","program":"机械设计制造及其自动化","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"电子与信息大类、农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类","public":["高等数学","英语"],"professional":["机械设计基础","机械制图"],"plan":200,"scheme":"cuhf-mechanical","sort":140},{"id":"b12-cuhf-iot-2026","school":"cuhf","program":"物联网工程","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"电子与信息大类、农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、公安与司法大类","public":["高等数学","英语"],"professional":["计算机专业基础","C语言程序设计"],"plan":90,"scheme":"cuhf-computer-c","sort":141},{"id":"b12-cuhf-electronics-2026","school":"cuhf","program":"电子信息工程","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"电子与信息大类、农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、公安与司法大类","public":["高等数学","英语"],"professional":["电路分析","数字电子技术基础"],"plan":90,"scheme":"cuhf-electronics","sort":142},{"id":"b12-cuhf-data-science-2026","school":"cuhf","program":"数据科学与大数据技术","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["高等数学","英语"],"professional":["计算机专业基础","C语言程序设计"],"plan":90,"scheme":"cuhf-computer-c","sort":143},{"id":"b12-cuhf-engineering-management-arts-2026","school":"cuhf","program":"工程管理","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["大学语文","英语"],"professional":["管理学基础","工程项目管理"],"plan":70,"scheme":"cuhf-construction-management-arts","sort":144},{"id":"b12-cuhf-engineering-cost-arts-2026","school":"cuhf","program":"工程造价","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["大学语文","英语"],"professional":["管理学基础","工程项目管理"],"plan":70,"scheme":"cuhf-construction-management-arts","sort":145},{"id":"b12-cuhf-engineering-management-science-2026","school":"cuhf","program":"工程管理","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["高等数学","英语"],"professional":["管理学基础","工程项目管理"],"plan":20,"scheme":"cuhf-construction-management-science","sort":146},{"id":"b12-cuhf-engineering-cost-science-2026","school":"cuhf","program":"工程造价","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["高等数学","英语"],"professional":["管理学基础","工程项目管理"],"plan":20,"scheme":"cuhf-construction-management-science","sort":147},{"id":"b12-cuhf-marketing-arts-2026","school":"cuhf","program":"市场营销","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["大学语文","英语"],"professional":["管理学基础","市场营销"],"plan":180,"scheme":"cuhf-marketing-arts","sort":148},{"id":"b12-cuhf-marketing-science-2026","school":"cuhf","program":"市场营销","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["高等数学","英语"],"professional":["管理学基础","市场营销"],"plan":60,"scheme":"cuhf-marketing-science","sort":149},{"id":"b12-cuhf-financial-management-arts-2026","school":"cuhf","program":"财务管理","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["大学语文","英语"],"professional":["管理学基础","财务管理学"],"plan":90,"scheme":"cuhf-financial-management-arts","sort":150},{"id":"b12-cuhf-financial-management-science-2026","school":"cuhf","program":"财务管理","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["高等数学","英语"],"professional":["管理学基础","财务管理学"],"plan":30,"scheme":"cuhf-financial-management-science","sort":151},{"id":"b12-cuhf-hr-arts-2026","school":"cuhf","program":"人力资源管理","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["大学语文","英语"],"professional":["管理学基础","人力资源管理"],"plan":70,"scheme":"cuhf-hr-arts","sort":152},{"id":"b12-cuhf-hr-science-2026","school":"cuhf","program":"人力资源管理","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["高等数学","英语"],"professional":["管理学基础","人力资源管理"],"plan":20,"scheme":"cuhf-hr-science","sort":153},{"id":"b12-cuhf-asset-arts-2026","school":"cuhf","program":"资产评估","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["大学语文","英语"],"professional":["管理学基础","房地产评估"],"plan":70,"scheme":"cuhf-asset-arts","sort":154},{"id":"b12-cuhf-asset-science-2026","school":"cuhf","program":"资产评估","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["高等数学","英语"],"professional":["管理学基础","房地产评估"],"plan":20,"scheme":"cuhf-asset-science","sort":155},{"id":"b12-cuhf-financial-engineering-arts-2026","school":"cuhf","program":"金融工程","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["大学语文","英语"],"professional":["管理学基础","经济学基础"],"plan":70,"scheme":"cuhf-financial-engineering-arts","sort":156},{"id":"b12-cuhf-financial-engineering-science-2026","school":"cuhf","program":"金融工程","site":"合肥城市学院（安徽省合肥市黄麓科教园1号；安徽省合肥市金岗大道88号；章程未按专业区分培养校区）","eligible":"土木建筑大类、农林牧渔大类、电子与信息大类、资源环境与安全大类、能源动力与材料大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、医药卫生大类、财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、文化艺术大类","public":["高等数学","英语"],"professional":["管理学基础","经济学基础"],"plan":20,"scheme":"cuhf-financial-engineering-science","sort":157},{"id":"b12-bctb-accounting-2026","school":"bctb","program":"会计学","site":"蚌埠工商学院（安徽省蚌埠市禹会区东海大道7100号）","eligible":"农林牧渔大类、能源动力与材料大类、土木建筑大类、装备制造大类、电子与信息大类、财经商贸大类、公共管理与服务大类","public":["大学语文","英语"],"professional":["管理学","基础会计学"],"plan":100,"scheme":"bctb-accounting","sort":158},{"id":"b12-bctb-finance-2026","school":"bctb","program":"金融学","site":"蚌埠工商学院（安徽省蚌埠市禹会区东海大道7100号）","eligible":"农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类、财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类","public":["大学语文","英语"],"professional":["经济学基础","金融学"],"plan":100,"scheme":"bctb-finance","sort":159},{"id":"b12-bctb-financial-management-2026","school":"bctb","program":"财务管理","site":"蚌埠工商学院（安徽省蚌埠市禹会区东海大道7100号）","eligible":"农林牧渔大类、能源动力与材料大类、土木建筑大类、装备制造大类、电子与信息大类、财经商贸大类、公共管理与服务大类","public":["大学语文","英语"],"professional":["管理学","基础会计学"],"plan":55,"scheme":"bctb-accounting","sort":160},{"id":"b12-bctb-business-management-2026","school":"bctb","program":"工商管理","site":"蚌埠工商学院（安徽省蚌埠市禹会区东海大道7100号）","eligible":"农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类、财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类","public":["大学语文","英语"],"professional":["管理学","战略管理"],"plan":100,"scheme":"bctb-business-management","sort":161},{"id":"b12-bctb-english-2026","school":"bctb","program":"英语","site":"蚌埠工商学院（安徽省蚌埠市禹会区东海大道7100号）","eligible":"财经商贸大类、文化艺术大类、新闻传播大类、教育与体育大类、公共管理与服务大类","public":["大学语文","英语"],"professional":["专业英语","笔译"],"plan":80,"scheme":"bctb-english","sort":162},{"id":"b12-bctb-logistics-2026","school":"bctb","program":"物流管理","site":"蚌埠工商学院（安徽省蚌埠市禹会区东海大道7100号）","eligible":"农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类、财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类","public":["大学语文","英语"],"professional":["管理学","物流管理"],"plan":100,"scheme":"bctb-logistics","sort":163},{"id":"b12-bctb-trade-2026","school":"bctb","program":"国际经济与贸易","site":"蚌埠工商学院（安徽省蚌埠市禹会区东海大道7100号）","eligible":"农林牧渔大类、财经商贸大类、旅游大类、公共管理与服务大类、教育与体育大类","public":["大学语文","英语"],"professional":["国际贸易实务","国际贸易"],"plan":55,"scheme":"bctb-trade","sort":164},{"id":"b12-bctb-hr-2026","school":"bctb","program":"人力资源管理","site":"蚌埠工商学院（安徽省蚌埠市禹会区东海大道7100号）","eligible":"农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类、财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类","public":["大学语文","英语"],"professional":["管理学","人力资源管理"],"plan":100,"scheme":"bctb-hr","sort":165},{"id":"b12-bctb-advertising-2026","school":"bctb","program":"广告学","site":"蚌埠工商学院（安徽省蚌埠市禹会区东海大道7100号）","eligible":"财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公共管理与服务大类","public":["大学语文","英语"],"professional":["管理学","广告学"],"plan":50,"scheme":"bctb-advertising","sort":166},{"id":"b12-bctb-marketing-2026","school":"bctb","program":"市场营销","site":"蚌埠工商学院（安徽省蚌埠市禹会区东海大道7100号）","eligible":"农林牧渔大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、生物与化工大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类、财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类","public":["大学语文","英语"],"professional":["管理学","市场营销学"],"plan":100,"scheme":"bctb-marketing","sort":167},{"id":"b12-bctb-visual-design-2026","school":"bctb","program":"视觉传达设计","site":"蚌埠工商学院（安徽省蚌埠市禹会区东海大道7100号）","eligible":"文化艺术大类、新闻传播大类、动漫制作技术（专业代码：510215）、数字媒体应用技术（专业代码：610210）、动漫设计与制作（专业代码：590110）、艺术教育（专业代码：670117）","public":["大学语文","英语"],"professional":["装饰画","平面设计"],"plan":80,"scheme":"bctb-visual-design","sort":168},{"id":"b12-bctb-economic-statistics-2026","school":"bctb","program":"经济统计学","site":"蚌埠工商学院（安徽省蚌埠市禹会区东海大道7100号）","eligible":"农林牧渔大类、能源动力与材料大类、土木建筑大类、装备制造大类、电子与信息大类、财经商贸大类、教育与体育大类","public":["高等数学","英语"],"professional":["经济学基础","统计学基础与应用"],"plan":52,"scheme":"bctb-economic-statistics","sort":169},{"id":"b12-whit-intelligent-construction-2026","school":"whit","program":"智能建造工程","site":"芜湖职业技术大学（文津校区：安徽省芜湖市文津西路201号；银湖校区：安徽省芜湖市银湖北路62号；白马校区：安徽省芜湖市长江南路与白马山路交汇处；南陵校区：安徽省芜湖市南陵县龙池路1号；章程未按专业区分培养校区）","eligible":"土木建筑大类、水利大类、资源环境与安全大类、能源动力与材料大类、交通运输大类、生物与化工大类、装备制造大类、电子与信息大类","public":["高等数学","英语"],"professional":["工程力学","材料力学"],"plan":50,"scheme":"whit-intelligent-construction","sort":170},{"id":"b12-whit-mechanical-2026","school":"whit","program":"机械设计制造及自动化","site":"芜湖职业技术大学（文津校区：安徽省芜湖市文津西路201号；银湖校区：安徽省芜湖市银湖北路62号；白马校区：安徽省芜湖市长江南路与白马山路交汇处；南陵校区：安徽省芜湖市南陵县龙池路1号；章程未按专业区分培养校区）","eligible":"装备制造大类、电子与信息大类、交通运输大类","public":["高等数学","英语"],"professional":["机械设计","机械制造基础"],"plan":100,"scheme":"whit-mechanical","sort":171},{"id":"b12-whit-automation-2026","school":"whit","program":"自动化技术与应用","site":"芜湖职业技术大学（文津校区：安徽省芜湖市文津西路201号；银湖校区：安徽省芜湖市银湖北路62号；白马校区：安徽省芜湖市长江南路与白马山路交汇处；南陵校区：安徽省芜湖市南陵县龙池路1号；章程未按专业区分培养校区）","eligible":"装备制造大类、电子与信息大类","public":["高等数学","英语"],"professional":["电路","模拟电子技术"],"plan":50,"scheme":"whit-automation","sort":172},{"id":"b12-whit-food-quality-2026","school":"whit","program":"食品质量与安全","site":"芜湖职业技术大学（文津校区：安徽省芜湖市文津西路201号；银湖校区：安徽省芜湖市银湖北路62号；白马校区：安徽省芜湖市长江南路与白马山路交汇处；南陵校区：安徽省芜湖市南陵县龙池路1号；章程未按专业区分培养校区）","eligible":"食品药品与粮食大类、农林牧渔大类、生物与化工大类、能源动力与材料大类","public":["高等数学","英语"],"professional":["无机及分析化学","微生物学"],"plan":50,"scheme":"whit-food-quality","sort":173},{"id":"b12-whit-ecommerce-2026","school":"whit","program":"电子商务","site":"芜湖职业技术大学（文津校区：安徽省芜湖市文津西路201号；银湖校区：安徽省芜湖市银湖北路62号；白马校区：安徽省芜湖市长江南路与白马山路交汇处；南陵校区：安徽省芜湖市南陵县龙池路1号；章程未按专业区分培养校区）","eligible":"财经商贸大类、新闻传播大类、公共管理与服务大类","public":["大学语文","英语"],"professional":["电子商务概论","管理学基础"],"plan":100,"scheme":"whit-ecommerce","sort":174}]$offerings$::jsonb)
    as x(
      id text, school text, program text, site text, eligible text,
      public jsonb, professional jsonb, plan integer, scheme text, sort integer
    )
), source_urls(school, charter_url, syllabus_url) as (
  values
    ('cuhf','https://www.cuhf.edu.cn/zsb/2026/0326/c1460a34145/page.htm','https://www.cuhf.edu.cn/zsb/2025/1031/c1447a32663/page.htm'),
    ('bctb','https://zs.bctb.edu.cn/2026/0318/c1031a34139/page.psp','https://zs.bctb.edu.cn/7a/4d/c1028a31309/page.htm'),
    ('whit','https://zs.whit.edu.cn/info/1024/2907.htm','https://zs.whit.edu.cn/info/1024/2924.htm')
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
  '2026招生章程与专业课考试大纲已核验', date '2026-10-06', true, 'published', source.sort
from source
join source_urls using (school);

do $$
begin
  if exists (
    (select row_data from batch_twelve_protected_offering_drafts
     except
     select to_jsonb(o) from public.admission_offerings o where o.status <> 'published' or o.active = false)
    union all
    (select to_jsonb(o) from public.admission_offerings o where o.status <> 'published' or o.active = false
     except
     select row_data from batch_twelve_protected_offering_drafts)
  ) or exists (
    (select row_data from batch_twelve_protected_point_drafts
     except
     select to_jsonb(p) from public.syllabus_points p where p.status <> 'published' or p.active = false)
    union all
    (select to_jsonb(p) from public.syllabus_points p where p.status <> 'published' or p.active = false
     except
     select row_data from batch_twelve_protected_point_drafts)
  ) or exists (
    (select row_data from batch_twelve_protected_resource_drafts
     except
     select to_jsonb(r) from public.resources r where r.status <> 'published')
    union all
    (select to_jsonb(r) from public.resources r where r.status <> 'published'
     except
     select row_data from batch_twelve_protected_resource_drafts)
  ) then
    raise exception 'Batch twelve stopped: protected draft/inactive content changed';
  end if;

  if (select count(*) from public.admission_offerings where status = 'published') <> 174
     or (select count(distinct school_slug) from public.admission_offerings where status = 'published') <> 41
     or (select count(*) from public.syllabus_points where status = 'published') <> 1033
     or (select count(*) from public.resources where status = 'published') <> 80 then
    raise exception 'Batch twelve stopped: published totals are incorrect';
  end if;

  if (select count(*) from public.admission_offerings where school_slug = 'cuhf' and status = 'published') <> 25
     or (select count(distinct p) from public.admission_offerings o cross join lateral unnest(o.program_names) p where o.school_slug = 'cuhf' and o.status = 'published') <> 17
     or (select sum(plan_count) from public.admission_offerings where school_slug = 'cuhf' and status = 'published') <> 2000
     or (select count(distinct exam_scheme_id) from public.admission_offerings where school_slug = 'cuhf' and status = 'published') <> 21 then
    raise exception 'Batch twelve stopped: Hefei City College verification failed';
  end if;

  if (select count(*) from public.admission_offerings where school_slug = 'bctb' and status = 'published') <> 12
     or (select count(distinct p) from public.admission_offerings o cross join lateral unnest(o.program_names) p where o.school_slug = 'bctb' and o.status = 'published') <> 12
     or (select sum(plan_count) from public.admission_offerings where school_slug = 'bctb' and status = 'published') <> 972
     or (select count(distinct exam_scheme_id) from public.admission_offerings where school_slug = 'bctb' and status = 'published') <> 11 then
    raise exception 'Batch twelve stopped: Bengbu College of Technology and Business verification failed';
  end if;

  if (select count(*) from public.admission_offerings where school_slug = 'whit' and status = 'published') <> 5
     or (select count(distinct p) from public.admission_offerings o cross join lateral unnest(o.program_names) p where o.school_slug = 'whit' and o.status = 'published') <> 5
     or (select sum(plan_count) from public.admission_offerings where school_slug = 'whit' and status = 'published') <> 350
     or (select count(distinct exam_scheme_id) from public.admission_offerings where school_slug = 'whit' and status = 'published') <> 5 then
    raise exception 'Batch twelve stopped: Wuhu Institute of Technology verification failed';
  end if;

  if exists (
    select 1 from public.syllabus_points where school_slug in ('cuhf','bctb','whit')
  ) or exists (
    select 1 from public.resources
    where resource_id like 'b12-%'
  ) then
    raise exception 'Batch twelve stopped: frozen syllabus/resource scope was modified';
  end if;

  if exists (
    select 1 from public.admission_offerings
    where school_slug = 'anhui-school-40'
  ) or exists (
    select 1 from public.syllabus_points
    where school_slug = 'anhui-school-40'
  ) or not exists (
    select 1 from public.academic_schools
    where wall_school_id = 'anhui-school-40' and school_slug = 'anhui-school-40' and has_study_map = false
  ) then
    raise exception 'Batch twelve stopped: Anhui Second Medical College protection changed';
  end if;

  if (select count(*) from public.admission_offerings where year = 2027 and status = 'draft' and active = false) <> 4
     or exists (select 1 from public.admission_offerings where year = 2027 and status <> 'draft')
     or (select count(*) from public.syllabus_points where status = 'draft' and active = false) <> 33 then
    raise exception 'Batch twelve stopped: draft/inactive isolation changed';
  end if;

  if (select version from public.content_versions where id = 'public-content') <= 107 then
    raise exception 'Batch twelve stopped: public content version was not advanced';
  end if;
end $$;



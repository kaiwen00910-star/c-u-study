-- Publish the tenth verified 2026 batch: seven school-first study maps.
-- Official facts come from each school's 2026 charter and syllabus page.
-- Existing draft rows are snapshotted and compared byte-for-byte at the end.

create temporary table batch_ten_protected_offering_drafts on commit drop as
select to_jsonb(o) as row_data
from public.admission_offerings o
where o.status = 'draft';

create temporary table batch_ten_protected_point_drafts on commit drop as
select to_jsonb(p) as row_data
from public.syllabus_points p
where p.status = 'draft';

do $$
begin
  if (select count(*) from batch_ten_protected_offering_drafts) <> 4 then
    raise exception 'Batch ten stopped: expected 4 protected draft offerings';
  end if;
  if (select count(*) from batch_ten_protected_point_drafts) <> 33 then
    raise exception 'Batch ten stopped: expected 33 protected draft syllabus points';
  end if;
  if exists (
    select 1 from public.admission_offerings
    where school_slug in ('anhui-school-02','anhui-school-03','anhui-school-05','anhui-school-07','anhui-school-12','anhui-school-13','anhui-school-15')
  ) or exists (
    select 1 from public.syllabus_points
    where school_slug in ('anhui-school-02','anhui-school-03','anhui-school-05','anhui-school-07','anhui-school-12','anhui-school-13','anhui-school-15')
  ) then
    raise exception 'Batch ten stopped: placeholder school slugs already have academic content';
  end if;
end $$;

update public.academic_schools
set school_slug = case wall_school_id
    when 'anhui-school-02' then 'ahau'
    when 'anhui-school-03' then 'ahmu'
    when 'anhui-school-05' then 'ahtcm'
    when 'anhui-school-07' then 'aqnu'
    when 'anhui-school-12' then 'bbmu'
    when 'anhui-school-13' then 'wnmc'
    when 'anhui-school-15' then 'chu'
  end,
  theme_color = case wall_school_id
    when 'anhui-school-02' then '#2F6B3B'
    when 'anhui-school-03' then '#176B87'
    when 'anhui-school-05' then '#8B3A3A'
    when 'anhui-school-07' then '#6A4C93'
    when 'anhui-school-12' then '#147D92'
    when 'anhui-school-13' then '#2A6F97'
    when 'anhui-school-15' then '#345995'
  end
where wall_school_id in ('anhui-school-02','anhui-school-03','anhui-school-05','anhui-school-07','anhui-school-12','anhui-school-13','anhui-school-15');

-- The old key prevented separate programs at the same campus. Program identity is
-- already modelled by program_names, so include it without changing existing rows.
drop index if exists public.admission_offerings_scope_school_site_unique;
create unique index admission_offerings_scope_school_site_program_unique
on public.admission_offerings (
  year, province_slug, major_slug, school_slug, lower(btrim(training_site)), program_names
);

with source as (
  select * from jsonb_to_recordset($offerings$[
    {"id":"ahau-water-2026","school":"ahau","program":"农业水利工程","site":"安徽水利水电职业技术学院（安徽省合肥市东门合马路18号）","eligible":"水利大类、土木建筑大类、交通运输大类、农林牧渔大类、资源环境与安全大类、能源动力与材料大类、装备制造大类、电子与信息大类","public":["高等数学","英语"],"professional":["工程力学","工程测量"],"plan":120,"scheme":"ahau-water-environment","sort":32},
    {"id":"ahau-environment-2026","school":"ahau","program":"环境工程","site":"安徽水利水电职业技术学院（安徽省合肥市东门合马路18号）","eligible":"资源环境与安全大类、生物与化工大类、土木建筑大类、食品药品与粮食大类、农林牧渔大类、装备制造大类、电子与信息大类","public":["高等数学","英语"],"professional":["工程力学","工程测量"],"plan":70,"scheme":"ahau-water-environment","sort":33},
    {"id":"ahau-electrical-2026","school":"ahau","program":"电气工程及其自动化","site":"安徽水利水电职业技术学院（安徽省合肥市东门合马路18号）","eligible":"装备制造大类、电子与信息大类、能源动力与材料大类、水利大类、财经商贸大类、交通运输大类、土木建筑大类、资源环境与安全大类","public":["高等数学","英语"],"professional":["机械制图","电工基础"],"plan":90,"scheme":"ahau-electrical-mechanical","sort":34},
    {"id":"ahau-mechanical-2026","school":"ahau","program":"机械设计制造及其自动化","site":"安徽水利水电职业技术学院（安徽省合肥市东门合马路18号）","eligible":"装备制造大类、电子与信息大类、能源动力与材料大类、水利大类、财经商贸大类、交通运输大类、土木建筑大类、资源环境与安全大类","public":["高等数学","英语"],"professional":["机械制图","电工基础"],"plan":90,"scheme":"ahau-electrical-mechanical","sort":35},
    {"id":"ahau-ecommerce-2026","school":"ahau","program":"电子商务","site":"安徽水利水电职业技术学院（安徽省合肥市东门合马路18号）","eligible":"财经商贸大类、公共管理与服务大类、电子与信息大类、文化艺术大类、新闻传播大类、旅游大类、教育与体育大类","public":["大学语文","英语"],"professional":["管理学","西方经济学（微观部分）"],"plan":100,"scheme":"ahau-ecommerce","sort":36},
    {"id":"ahau-horticulture-2026","school":"ahau","program":"园艺","site":"宿州职业技术学院（安徽省宿州市高新区）","eligible":"农林牧渔大类、生物与化工大类、医药卫生大类、轻工纺织大类、食品药品与粮食大类、资源环境与安全大类、土木建筑大类","public":["高等数学","英语"],"professional":["生物学概论","农业概论"],"plan":60,"scheme":"ahau-agriculture","sort":37},
    {"id":"ahau-animal-science-2026","school":"ahau","program":"动物科学","site":"宿州职业技术学院（安徽省宿州市高新区）","eligible":"农林牧渔大类、生物与化工大类、医药卫生大类、轻工纺织大类、食品药品与粮食大类、资源环境与安全大类、土木建筑大类","public":["高等数学","英语"],"professional":["生物学概论","农业概论"],"plan":60,"scheme":"ahau-agriculture","sort":38},

    {"id":"ahmu-nursing-anqing-2026","school":"ahmu","program":"护理学","site":"安庆医药高等专科学校（安徽省安庆市集贤北路1588号）","eligible":"护理、助产","public":["大学语文","英语"],"professional":["解剖生理学","护理学基础"],"plan":80,"scheme":"ahmu-nursing","sort":39},
    {"id":"ahmu-nursing-wanxi-2026","school":"ahmu","program":"护理学","site":"皖西卫生职业学院（安徽省六安市皋城中路406号）","eligible":"护理、助产","public":["大学语文","英语"],"professional":["解剖生理学","护理学基础"],"plan":120,"scheme":"ahmu-nursing","sort":40},
    {"id":"ahmu-nursing-wanbei-2026","school":"ahmu","program":"护理学","site":"皖北卫生职业学院（安徽省宿州市埇桥区学府大道1606号）","eligible":"护理、助产","public":["大学语文","英语"],"professional":["解剖生理学","护理学基础"],"plan":120,"scheme":"ahmu-nursing","sort":41},
    {"id":"ahmu-pharmacy-anqing-2026","school":"ahmu","program":"药学","site":"安庆医药高等专科学校（安徽省安庆市集贤北路1588号）","eligible":"药学、中药学、药品生产技术、药品质量与安全、生物制药技术、化学制药技术、药物制剂技术、中药制药、中药制药技术、药品服务与管理、药品经营与管理、药品生物技术、制药设备应用技术","public":["高等数学","英语"],"professional":["药理学","药剂学"],"plan":40,"scheme":"ahmu-pharmacy","sort":42},
    {"id":"ahmu-pharmacy-wanxi-2026","school":"ahmu","program":"药学","site":"皖西卫生职业学院（安徽省六安市皋城中路406号）","eligible":"药学、中药学、药品生产技术、药品质量与安全、生物制药技术、化学制药技术、药物制剂技术、中药制药、中药制药技术、药品服务与管理、药品经营与管理、药品生物技术、制药设备应用技术","public":["高等数学","英语"],"professional":["药理学","药剂学"],"plan":60,"scheme":"ahmu-pharmacy","sort":43},
    {"id":"ahmu-tcm-2026","school":"ahmu","program":"中药学","site":"安庆医药高等专科学校（安徽省安庆市集贤北路1588号）","eligible":"药学、中药学、药品服务与管理、药品经营与管理、药品生产技术、药品质量与安全、针灸推拿、中医学、中医骨伤、生物制药技术、化学制药技术、药物制剂技术、中药制药、中药制药技术、中药生产与加工、中药材生产与加工","public":["大学语文","英语"],"professional":["中药学","中药鉴定学"],"plan":30,"scheme":"ahmu-tcm","sort":44},
    {"id":"ahmu-rehab-2026","school":"ahmu","program":"康复治疗学","site":"安庆医药高等专科学校（安徽省安庆市集贤北路1588号）","eligible":"康复治疗技术、临床医学、针灸推拿、中医学、中医骨伤、中医养生保健、中医康复技术、言语听觉康复技术、康复工程技术、运动防护、体育保健与康复、戒毒矫治技术","public":["高等数学","英语"],"professional":["康复评定技术","康复治疗技术"],"plan":30,"scheme":"ahmu-rehab","sort":45},

    {"id":"ahtcm-acupuncture-2026","school":"ahtcm","program":"针灸推拿学","site":"安徽中医药高等专科学校（安徽省芜湖市乌霞山西路18号）","eligible":"针灸推拿、中医学、中医骨伤","public":["大学语文","英语"],"professional":["针灸学","推拿学"],"plan":60,"scheme":"ahtcm-acupuncture","sort":46},
    {"id":"ahtcm-rehab-2026","school":"ahtcm","program":"康复治疗学","site":"安徽中医药高等专科学校（安徽省芜湖市乌霞山西路18号）","eligible":"康复治疗技术、临床医学、针灸推拿、中医学、中医骨伤、中医养生保健、中医康复技术、言语听觉康复技术、康复工程技术、运动防护、体育保健与康复、戒毒矫治技术、社区康复","public":["大学语文","英语"],"professional":["康复评定学","解剖生理学"],"plan":60,"scheme":"ahtcm-rehab","sort":47},
    {"id":"ahtcm-pharmacy-2026","school":"ahtcm","program":"药学","site":"安徽中医药高等专科学校（安徽省芜湖市乌霞山西路18号）","eligible":"药学、中药学、药品服务与管理、药品经营与管理、药品生产技术、药品质量与安全、预防医学、临床医学、生物制药技术、药物制剂技术、中药制药、中药制药技术、化学制药技术、食品药品监督管理、药品质量检测技术、生化制药技术、医药营销、药品质量、药品生物技术","public":["高等数学","英语"],"professional":["药理学","无机化学"],"plan":60,"scheme":"ahtcm-pharmacy","sort":48},
    {"id":"ahtcm-tcm-bozhou-2026","school":"ahtcm","program":"中药学","site":"亳州职业技术学院（安徽省亳州市药都路1625号）","eligible":"药学、中药学、药品服务与管理、药品经营与管理、药品生产技术、药品质量与安全、针灸推拿、中医学、中医骨伤、生物制药技术、药物制剂技术、中药制药、中药制药技术、化学制药技术、中药生产与加工、中药材生产与加工、药膳与食疗","public":["高等数学","英语"],"professional":["中药学","无机化学"],"plan":100,"scheme":"ahtcm-tcm","sort":49},
    {"id":"ahtcm-tcm-wuhu-2026","school":"ahtcm","program":"中药学","site":"安徽中医药高等专科学校（安徽省芜湖市乌霞山西路18号）","eligible":"药学、中药学、药品服务与管理、药品经营与管理、药品生产技术、药品质量与安全、针灸推拿、中医学、中医骨伤、生物制药技术、药物制剂技术、中药制药、中药制药技术、化学制药技术、中药生产与加工、中药材生产与加工、药膳与食疗","public":["高等数学","英语"],"professional":["中药学","无机化学"],"plan":60,"scheme":"ahtcm-tcm","sort":50},
    {"id":"ahtcm-nursing-bozhou-2026","school":"ahtcm","program":"护理学","site":"亳州职业技术学院（安徽省亳州市药都路1625号）","eligible":"护理、助产","public":["大学语文","英语"],"professional":["护理学基础","解剖生理学"],"plan":100,"scheme":"ahtcm-nursing","sort":51},
    {"id":"ahtcm-nursing-wuhu-2026","school":"ahtcm","program":"护理学","site":"安徽中医药高等专科学校（安徽省芜湖市乌霞山西路18号）","eligible":"护理、助产","public":["大学语文","英语"],"professional":["护理学基础","解剖生理学"],"plan":60,"scheme":"ahtcm-nursing","sort":52},

    {"id":"aqnu-chemical-2026","school":"aqnu","program":"化学工程与工艺","site":"安庆师范大学龙山校区（安徽省安庆市集贤北路1318号）","eligible":"生物与化工大类、资源环境与安全大类","public":["高等数学","英语"],"professional":["化工概论","大学化学"],"plan":20,"scheme":"aqnu-chemical","sort":53},
    {"id":"aqnu-preschool-2026","school":"aqnu","program":"学前教育","site":"桐城师范高等专科学校（安徽省桐城市经开区学苑路199号）","eligible":"教育与体育大类","public":["大学语文","英语"],"professional":["学前教育学","学前儿童发展心理学"],"plan":30,"scheme":"aqnu-preschool","sort":54},

    {"id":"bbmu-nursing-2026","school":"bbmu","program":"护理学","site":"滁州城市职业学院（安徽省滁州市南谯区醉翁西路101号）","eligible":"护理、助产","public":["大学语文","英语"],"professional":["解剖生理学","护理学基础"],"plan":90,"scheme":"bbmu-nursing","sort":55},
    {"id":"bbmu-lab-2026","school":"bbmu","program":"医学检验技术","site":"滁州城市职业学院（安徽省滁州市南谯区醉翁西路101号）","eligible":"临床医学、护理、药学、医学检验技术、医学影像技术、卫生检验与检疫技术、医学生物技术","public":["高等数学","英语"],"professional":["解剖生理学","诊断学"],"plan":60,"scheme":"bbmu-lab","sort":56},
    {"id":"bbmu-preventive-2026","school":"bbmu","program":"预防医学","site":"蚌埠医科大学（安徽省蚌埠市东海大道2600号）","eligible":"预防医学","public":["高等数学","英语"],"professional":["解剖生理学","预防医学"],"plan":30,"scheme":"bbmu-preventive","sort":57},
    {"id":"bbmu-imaging-2026","school":"bbmu","program":"医学影像技术","site":"蚌埠医科大学（安徽省蚌埠市东海大道2600号）","eligible":"医学影像技术、放射治疗技术、临床医学","public":["高等数学","英语"],"professional":["解剖生理学","医学影像诊断学"],"plan":60,"scheme":"bbmu-imaging","sort":58},
    {"id":"bbmu-pharmacy-2026","school":"bbmu","program":"药学","site":"滁州城市职业学院（安徽省滁州市南谯区醉翁西路101号）","eligible":"医药卫生大类、药品生产技术、药品质量与安全、生物制药技术、化学制药技术、药物制剂技术、中药制药技术、药品服务与管理、药品经营与管理","public":["高等数学","英语"],"professional":["药理学","药剂学"],"plan":30,"scheme":"bbmu-pharmacy","sort":59},
    {"id":"bbmu-rehab-2026","school":"bbmu","program":"康复治疗学","site":"滁州城市职业学院（安徽省滁州市南谯区醉翁西路101号）","eligible":"康复治疗技术、护理、临床医学、中医康复技术、针灸推拿、中医学、中医骨伤、中医养生保健、言语听觉康复技术、康复工程技术、运动防护、体育保健与康复、戒毒矫治技术","public":["高等数学","英语"],"professional":["解剖生理学","康复评定学"],"plan":30,"scheme":"bbmu-rehab","sort":60},

    {"id":"wnmc-lab-2026","school":"wnmc","program":"医学检验技术","site":"皖南医学院滨江校区北区（安徽省芜湖市弋江区文昌西路22号）","eligible":"医学检验技术、医学生物技术、卫生检验与检疫技术、临床医学、护理、药学、医学影像技术","public":["高等数学","英语"],"professional":["生物化学","人体解剖生理学"],"plan":30,"scheme":"wnmc-lab","sort":61},
    {"id":"wnmc-nursing-2026","school":"wnmc","program":"护理学","site":"宣城职业技术学院（安徽省宣城市薰化路698号）","eligible":"护理、助产","public":["大学语文","英语"],"professional":["内科护理学","基础护理学"],"plan":60,"scheme":"wnmc-nursing","sort":62},

    {"id":"chu-preschool-2026","school":"chu","program":"学前教育","site":"巢湖学院（安徽省合肥市安徽巢湖经济开发区半汤路1号）","eligible":"财经商贸大类、公安与司法大类、教育与体育大类、文化艺术大类、新闻传播大类、旅游大类、公共管理与服务大类","public":["大学语文","英语"],"professional":["教育学","心理学"],"plan":60,"scheme":"chu-preschool","sort":63},
    {"id":"chu-chinese-2026","school":"chu","program":"汉语言文学","site":"巢湖学院（安徽省合肥市安徽巢湖经济开发区半汤路1号）","eligible":"财经商贸大类、公安与司法大类、教育与体育大类、文化艺术大类、新闻传播大类、旅游大类、公共管理与服务大类","public":["大学语文","英语"],"professional":["中国古代文学","现代汉语"],"plan":130,"scheme":"chu-chinese","sort":64},
    {"id":"chu-ecommerce-2026","school":"chu","program":"电子商务","site":"巢湖学院（安徽省合肥市安徽巢湖经济开发区半汤路1号）","eligible":"财经商贸大类、旅游大类、文化艺术大类、新闻传播大类、教育与体育大类、公安与司法大类、公共管理与服务大类、资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、轻工纺织大类、食品药品与粮食大类、交通运输大类、电子与信息大类、医药卫生大类","public":["大学语文","英语"],"professional":["管理学原理","市场营销"],"plan":60,"scheme":"chu-ecommerce","sort":65},
    {"id":"chu-hotel-2026","school":"chu","program":"酒店管理","site":"巢湖学院（安徽省合肥市安徽巢湖经济开发区半汤路1号）","eligible":"财经商贸大类、教育与体育大类、文化艺术大类、旅游大类、农林牧渔大类、食品药品与粮食大类、资源环境与安全大类、公共管理与服务大类、新闻传播大类、土木建筑大类、水利大类、装备制造大类、轻工纺织大类、交通运输大类、电子与信息大类、医药卫生大类","public":["大学语文","英语"],"professional":["管理学原理","旅游学概论"],"plan":120,"scheme":"chu-hotel","sort":66},
    {"id":"chu-business-english-2026","school":"chu","program":"商务英语","site":"巢湖学院（安徽省合肥市安徽巢湖经济开发区半汤路1号）","eligible":"财经商贸大类、旅游大类、新闻传播大类、教育与体育大类、食品药品与粮食大类、装备制造大类、轻工纺织大类、电子与信息大类、文化艺术大类、公共管理与服务大类、能源动力与材料大类、公安与司法大类、医药卫生大类","public":["大学语文","英语"],"professional":["综合英语","国际贸易实务"],"plan":30,"scheme":"chu-business-english","sort":67}
  ]$offerings$::jsonb) as x(
    id text, school text, program text, site text, eligible text,
    public text[], professional text[], plan integer, scheme text, sort integer
  )
), links(school, charter, syllabus) as (values
  ('ahau','https://zsb.ahau.edu.cn/info/1036/12394.htm','https://zsb.ahau.edu.cn/info/1028/11704.htm'),
  ('ahmu','https://zs.ahmu.edu.cn/2026/0319/c7123a197585/page.htm','https://zs.ahmu.edu.cn/2025/1114/c7123a193486/page.htm'),
  ('ahtcm','https://bkzs.ahtcm.edu.cn/info/1233/4776.htm','https://bkzs.ahtcm.edu.cn/info/1213/4736.htm'),
  ('aqnu','https://zsw.aqnu.edu.cn/info/1311/23659.htm','https://zsw.aqnu.edu.cn/info/1361/23679.htm'),
  ('bbmu','https://zsw.bbmu.edu.cn/info/1006/3342.htm','https://zsw.bbmu.edu.cn/info/1006/3282.htm'),
  ('wnmc','https://zsb.wnmc.edu.cn/__local/3/7E/D5/041BB95CFAB5989C5AD88A7B7E4_182A5F2D_3179F.pdf','https://zsb.wnmc.edu.cn/info/1021/8341.htm'),
  ('chu','https://www.chu.edu.cn/zsw/2026/0319/c1511a204968/page.htm','https://www.chu.edu.cn/zsw/2025/1112/c1529a200312/page.htm')
)
insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, program_names, exam_scheme_id,
  training_site, eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
)
select source.id, 2026, 'anhui', 'all-programs', source.school, array[source.program], source.scheme,
  source.site, source.eligible, source.public, source.professional, source.plan,
  links.charter, links.syllabus, '2026正式招生章程与官方专业课考纲', date '2026-10-03', true, 'published', source.sort
from source join links using (school);

-- Topic groups are faithful, compact study-map nodes derived from the official syllabi.
-- Reused subjects share canonical_topic resources but retain school-specific points.
with subject_data as (
  select * from jsonb_to_recordset($subjects$[
    {"school":"ahau","slug":"engineering-mechanics","name":"工程力学","topic":"engineering-mechanics","section":"静力学与材料力学","points":["静力学公理、约束与受力分析","平面力系的合成与平衡","空间力系与重心","轴向拉压、扭转与弯曲","应力状态、强度与刚度"]},
    {"school":"ahau","slug":"engineering-survey","name":"工程测量","topic":"engineering-survey","section":"测量基础与应用","points":["测量坐标系统与误差基础","水准测量原理与计算","角度和距离测量","控制测量与地形图测绘","施工测量与变形观测"]},
    {"school":"ahau","slug":"mechanical-drawing","name":"机械制图","topic":"mechanical-drawing","section":"制图基础","points":["国家制图标准与基本作图","投影法和点线面投影","基本体与组合体视图","机件常用表达方法","标准件、零件图与装配图"]},
    {"school":"ahau","slug":"electrical-basics","name":"电工基础","topic":"electrical-basics","section":"电路与电机基础","points":["电路模型与基尔霍夫定律","直流电路分析方法","正弦交流电路","三相电路与功率","变压器、电动机与安全用电"]},
    {"school":"ahau","slug":"management","name":"管理学","topic":"management","section":"管理职能","points":["管理活动与管理理论","决策及其方法","组织设计与组织变革","领导、激励与沟通","控制过程与创新"]},
    {"school":"ahau","slug":"microeconomics","name":"西方经济学（微观部分）","topic":"microeconomics","section":"微观经济学","points":["需求供给与均衡价格","消费者选择与效用","生产函数与成本","完全竞争与不完全竞争市场","要素市场、市场失灵与政策"]},
    {"school":"ahau","slug":"general-biology","name":"生物学概论","topic":"general-biology","section":"生命科学基础","points":["生命的化学基础","细胞结构、代谢与分裂","遗传规律与分子基础","生物进化与多样性","植物、动物与生态系统"]},
    {"school":"ahau","slug":"agriculture-intro","name":"农业概论","topic":"agriculture-intro","section":"农业系统","points":["农业与农业生态系统","作物生产与耕作制度","园艺和植物保护基础","畜牧、水产与农业工程","现代农业与可持续发展"]},

    {"school":"ahmu","slug":"anatomy-physiology","name":"解剖生理学","topic":"anatomy-physiology","section":"人体结构与功能","points":["细胞、组织与运动系统","血液与循环系统","呼吸与消化系统","泌尿与生殖系统","神经、感觉与内分泌调节"]},
    {"school":"ahmu","slug":"nursing-foundations","name":"护理学基础","topic":"nursing-foundations","section":"基础护理","points":["护理程序与医院环境","清洁、舒适与安全护理","生命体征观察与给药","静脉输液、输血与标本采集","病情观察、急救与临终护理"]},
    {"school":"ahmu","slug":"pharmacology","name":"药理学","topic":"pharmacology","section":"药理作用与临床用药","points":["药效学与药动学","传出神经系统药物","中枢神经系统药物","心血管和内脏系统药物","抗感染、抗肿瘤与合理用药"]},
    {"school":"ahmu","slug":"pharmaceutics","name":"药剂学","topic":"pharmaceutics","section":"药物制剂","points":["药剂学基础与处方设计","液体和灭菌制剂","固体制剂","半固体、经皮与黏膜制剂","新型递药系统与稳定性"]},
    {"school":"ahmu","slug":"traditional-chinese-medicine","name":"中药学","topic":"traditional-chinese-medicine","section":"中药性能与分类","points":["中药性能、配伍与用药禁忌","解表、清热与泻下药","祛风湿、化湿与利水药","温里、理气与消食药","补虚、收涩及其他类中药"]},
    {"school":"ahmu","slug":"tcm-identification","name":"中药鉴定学","topic":"tcm-identification","section":"中药鉴定","points":["中药鉴定依据与方法","根及根茎类药材鉴定","茎木、皮和叶类药材鉴定","花果种子类药材鉴定","动物、矿物及其他类药材鉴定"]},
    {"school":"ahmu","slug":"rehab-assessment","name":"康复评定技术","topic":"rehab-assessment","section":"功能评定","points":["康复评定概论与流程","人体形态、关节活动和肌力评定","感觉、平衡与协调评定","步态和日常生活活动评定","心肺、言语与认知功能评定"]},
    {"school":"ahmu","slug":"rehab-treatment","name":"康复治疗技术","topic":"rehab-treatment","section":"康复治疗","points":["运动治疗基本技术","物理因子治疗","作业治疗与辅助器具","言语、吞咽与认知训练","常见疾病康复方案"]},

    {"school":"ahtcm","slug":"acupuncture","name":"针灸学","topic":"acupuncture","section":"经络腧穴与刺灸","points":["经络系统组成与作用","腧穴定位与主治规律","十二经脉常用腧穴","毫针、灸法与拔罐技术","常见病证针灸治疗"]},
    {"school":"ahtcm","slug":"tuina","name":"推拿学","topic":"tuina","section":"推拿手法与治疗","points":["推拿作用原理与基本要求","摆动类、摩擦类和振动类手法","挤压类、叩击类和运动关节类手法","成人常见病推拿治疗","小儿推拿常用穴位与治疗"]},
    {"school":"ahtcm","slug":"rehab-assessment","name":"康复评定学","topic":"rehab-assessment","section":"功能评定","points":["康复评定概论与流程","人体形态、关节活动和肌力评定","感觉、平衡与协调评定","步态和日常生活活动评定","心肺、言语与认知功能评定"]},
    {"school":"ahtcm","slug":"anatomy-physiology","name":"解剖生理学","topic":"anatomy-physiology","section":"人体结构与功能","points":["细胞、组织与运动系统","血液与循环系统","呼吸与消化系统","泌尿与生殖系统","神经、感觉与内分泌调节"]},
    {"school":"ahtcm","slug":"pharmacology","name":"药理学","topic":"pharmacology","section":"药理作用与临床用药","points":["药效学与药动学","传出神经系统药物","中枢神经系统药物","心血管和内脏系统药物","抗感染、抗肿瘤与合理用药"]},
    {"school":"ahtcm","slug":"inorganic-chemistry","name":"无机化学","topic":"inorganic-chemistry","section":"无机化学基础","points":["原子结构与元素周期律","化学键与分子结构","化学热力学与反应速率","溶液平衡和酸碱平衡","沉淀、氧化还原与配位平衡"]},
    {"school":"ahtcm","slug":"traditional-chinese-medicine","name":"中药学","topic":"traditional-chinese-medicine","section":"中药性能与分类","points":["中药性能、配伍与用药禁忌","解表、清热与泻下药","祛风湿、化湿与利水药","温里、理气与消食药","补虚、收涩及其他类中药"]},
    {"school":"ahtcm","slug":"nursing-foundations","name":"护理学基础","topic":"nursing-foundations","section":"基础护理","points":["护理程序与医院环境","清洁、舒适与安全护理","生命体征观察与给药","静脉输液、输血与标本采集","病情观察、急救与临终护理"]},

    {"school":"aqnu","slug":"chemical-engineering","name":"化工概论","topic":"chemical-engineering","section":"化学工业与过程","points":["化学工业、单元操作与流程","天然气、煤与碳一化工","石油炼制与石油化工","高分子和精细化工","生物化工、绿色化工与发展挑战"]},
    {"school":"aqnu","slug":"university-chemistry","name":"大学化学","topic":"university-chemistry","section":"化学原理与有机基础","points":["物质结构与化学键","反应速率和化学平衡","酸碱、沉淀与氧化还原平衡","配位、分光和电位分析","烃及含氧含氮有机化合物"]},
    {"school":"aqnu","slug":"preschool-education","name":"学前教育学","topic":"preschool-education","section":"学前教育原理与实践","points":["学前教育及其发展","儿童观、教育观与教育原则","幼儿园课程与教学活动","游戏、生活与环境创设","幼儿园家庭社区合作与评价"]},
    {"school":"aqnu","slug":"child-psychology","name":"学前儿童发展心理学","topic":"child-psychology","section":"学前儿童心理发展","points":["儿童心理发展的基本理论","认知、言语与智力发展","情绪情感与意志发展","个性与社会性发展","儿童心理研究与教育应用"]},

    {"school":"bbmu","slug":"anatomy-physiology","name":"解剖生理学","topic":"anatomy-physiology","section":"人体结构与功能","points":["细胞、组织与运动系统","血液与循环系统","呼吸与消化系统","泌尿与生殖系统","神经、感觉与内分泌调节"]},
    {"school":"bbmu","slug":"nursing-foundations","name":"护理学基础","topic":"nursing-foundations","section":"基础护理","points":["护理程序与医院环境","清洁、舒适与安全护理","生命体征观察与给药","静脉输液、输血与标本采集","病情观察、急救与临终护理"]},
    {"school":"bbmu","slug":"diagnostics","name":"诊断学","topic":"diagnostics","section":"临床诊断基础","points":["常见症状及其临床意义","问诊与病史采集","一般检查和系统体格检查","实验室检查与辅助检查","病历书写与临床诊断思维"]},
    {"school":"bbmu","slug":"preventive-medicine","name":"预防医学","topic":"preventive-medicine","section":"公共卫生与疾病预防","points":["健康影响因素与三级预防","环境与职业卫生","营养、食品与健康","流行病学和卫生统计基础","传染病与慢性病预防控制"]},
    {"school":"bbmu","slug":"medical-imaging","name":"医学影像诊断学","topic":"medical-imaging","section":"影像技术与系统诊断","points":["X线、CT、MRI与超声成像基础","呼吸和循环系统影像","消化与泌尿生殖系统影像","骨关节与软组织影像","中枢神经和头颈部影像"]},
    {"school":"bbmu","slug":"pharmacology","name":"药理学","topic":"pharmacology","section":"药理作用与临床用药","points":["药效学与药动学","传出神经系统药物","中枢神经系统药物","心血管和内脏系统药物","抗感染、抗肿瘤与合理用药"]},
    {"school":"bbmu","slug":"pharmaceutics","name":"药剂学","topic":"pharmaceutics","section":"药物制剂","points":["药剂学基础与处方设计","液体和灭菌制剂","固体制剂","半固体、经皮与黏膜制剂","新型递药系统与稳定性"]},
    {"school":"bbmu","slug":"rehab-assessment","name":"康复评定学","topic":"rehab-assessment","section":"功能评定","points":["康复评定概论与流程","人体形态、关节活动和肌力评定","感觉、平衡与协调评定","步态和日常生活活动评定","心肺、言语与认知功能评定"]},

    {"school":"wnmc","slug":"biochemistry","name":"生物化学","topic":"biochemistry","section":"生命分子与代谢","points":["蛋白质结构、功能与酶","糖代谢与生物氧化","脂类和氨基酸代谢","核酸结构与遗传信息传递","肝胆、血液生化与代谢调节"]},
    {"school":"wnmc","slug":"anatomy-physiology","name":"人体解剖生理学","topic":"anatomy-physiology","section":"人体结构与功能","points":["细胞、组织与运动系统","血液与循环系统","呼吸与消化系统","泌尿与生殖系统","神经、感觉与内分泌调节"]},
    {"school":"wnmc","slug":"medical-nursing","name":"内科护理学","topic":"medical-nursing","section":"内科系统护理","points":["呼吸与循环系统疾病护理","消化与泌尿系统疾病护理","血液和内分泌系统疾病护理","风湿与神经系统疾病护理","传染病护理与临床综合应用"]},
    {"school":"wnmc","slug":"nursing-foundations","name":"基础护理学","topic":"nursing-foundations","section":"基础护理","points":["护理程序与医院环境","清洁、舒适与安全护理","生命体征观察与给药","静脉输液、输血与标本采集","病情观察、急救与临终护理"]},

    {"school":"chu","slug":"education","name":"教育学","topic":"education","section":"教育基本理论","points":["教育及其社会功能","教育目的与全面发展","学校教育制度与课程","教学过程、原则与方法","教师、学生与班级管理"]},
    {"school":"chu","slug":"psychology","name":"心理学","topic":"psychology","section":"普通心理学","points":["心理学对象、方法与发展","感觉、知觉、意识与注意","记忆、思维与学习","情绪、意志与动机","能力、人格、心理健康与社会心理"]},
    {"school":"chu","slug":"ancient-chinese-literature","name":"中国古代文学","topic":"ancient-chinese-literature","section":"古代文学史与作品","points":["先秦诗歌、散文与楚辞","秦汉辞赋、史传与乐府","魏晋南北朝文学","唐诗与宋词","元明清戏曲小说与《红楼梦》"]},
    {"school":"chu","slug":"modern-chinese","name":"现代汉语","topic":"modern-chinese","section":"现代汉语系统","points":["现代汉语概述与语音","汉字结构与规范","词汇构成与词义","语法单位、短语和句子","修辞方式与语言运用"]},
    {"school":"chu","slug":"management","name":"管理学原理","topic":"management","section":"管理职能","points":["管理活动与管理理论","决策及其方法","组织设计与组织变革","领导、激励与沟通","控制过程与创新"]},
    {"school":"chu","slug":"marketing","name":"市场营销","topic":"marketing","section":"市场营销管理","points":["市场营销观念与环境","消费者和组织市场分析","市场细分、选择与定位","产品、价格与渠道策略","促销组合与营销管理"]},
    {"school":"chu","slug":"tourism","name":"旅游学概论","topic":"tourism","section":"旅游系统","points":["旅游活动与旅游者","旅游资源与开发保护","旅游业及主要部门","旅游市场与旅游影响","旅游组织与可持续发展"]},
    {"school":"chu","slug":"comprehensive-english","name":"综合英语","topic":"comprehensive-english","section":"英语综合能力","points":["词汇、语法与句法运用","英语阅读理解与篇章分析","完形填空与语境判断","英汉互译基础","英语写作与综合表达"]},
    {"school":"chu","slug":"international-trade","name":"国际贸易实务","topic":"international-trade","section":"国际贸易流程","points":["国际贸易术语与惯例","商品条件与价格核算","国际货物运输与保险","国际货款收付","合同磋商、履行与争议处理"]}
  ]$subjects$::jsonb) as x(school text, slug text, name text, topic text, section text, points jsonb)
), expanded as (
  select d.*, p.point_title, p.ordinality::integer as point_order
  from subject_data d
  cross join lateral jsonb_array_elements_text(d.points) with ordinality as p(point_title, ordinality)
), common_chinese as (
  select 'common'::text as school, 'college-chinese'::text as slug, '大学语文'::text as name,
    'college-chinese'::text as topic, '大学语文公共课'::text as section,
    p.point_title, p.ordinality::integer as point_order
  from jsonb_array_elements_text('["文学常识与名篇阅读","文言文阅读与翻译","现代文阅读与鉴赏","语言文字运用与写作"]'::jsonb)
    with ordinality as p(point_title, ordinality)
), all_points as (
  select school, slug, name, topic, section, point_title, point_order from expanded
  union all
  select * from common_chinese
)
insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
)
select concat(case when school = 'common' then 'batch10' else school end, '-', slug, '-', point_order),
  2026, 'anhui', 'all-programs', school, slug, name, 1, section, point_order, point_title, topic, true, 'published'
from all_points;

with source as (
  select * from jsonb_to_recordset($resources$[
    {"id":"college-chinese","topic":"college-chinese","title":"大学语文","url":"https://www.icourse163.org/course/NWU-1001756009"},
    {"id":"engineering-mechanics","topic":"engineering-mechanics","title":"工程力学","url":"https://www.icourse163.org/course/detail.htm?cid=1001795015"},
    {"id":"engineering-survey","topic":"engineering-survey","title":"工程测量","url":"https://www.icourse163.org/course/detail.htm?cid=1206646809"},
    {"id":"mechanical-drawing","topic":"mechanical-drawing","title":"机械制图","url":"https://www.icourse163.org/course/detail.htm?cid=1002746007"},
    {"id":"electrical-basics","topic":"electrical-basics","title":"电工基础","url":"https://www.icourse163.org/course/detail.htm?cid=1001753144"},
    {"id":"management","topic":"management","title":"管理学","url":"https://www.icourse163.org/course/JNU-1002534011"},
    {"id":"microeconomics","topic":"microeconomics","title":"微观经济学","url":"https://www.icourse163.org/course/detail.htm?cid=1003544054"},
    {"id":"general-biology","topic":"general-biology","title":"普通生物学","url":"https://www.icourse163.org/course/detail.htm?cid=1002428002"},
    {"id":"agriculture-intro","topic":"agriculture-intro","title":"农业概论","url":"https://www.icourse163.org/course/detail.htm?cid=1205678804"},
    {"id":"anatomy-physiology","topic":"anatomy-physiology","title":"人体解剖生理学","url":"https://www.icourse163.org/course/detail.htm?cid=1002527016"},
    {"id":"nursing-foundations","topic":"nursing-foundations","title":"基础护理学","url":"https://www.icourse163.org/course/sdu-195001"},
    {"id":"pharmacology","topic":"pharmacology","title":"药理学","url":"https://www.icourse163.org/course/detail.htm?cid=1002126002"},
    {"id":"pharmaceutics","topic":"pharmaceutics","title":"药剂学","url":"https://www.icourse163.org/course/SYPHU-1472004165"},
    {"id":"traditional-chinese-medicine","topic":"traditional-chinese-medicine","title":"中药学","url":"https://www.icourse163.org/course/NJUTCM-1001752319"},
    {"id":"tcm-identification","topic":"tcm-identification","title":"中药鉴定学","url":"https://www.icourse163.org/course/detail.htm?cid=1002126015"},
    {"id":"rehab-assessment","topic":"rehab-assessment","title":"康复评定学","url":"https://www.icourse163.org/course/BZYXY-1207453801"},
    {"id":"rehab-treatment","topic":"rehab-treatment","title":"康复治疗技术","url":"https://www.icourse163.org/course/201908-1449631161"},
    {"id":"acupuncture","topic":"acupuncture","title":"针灸学","url":"https://www.icourse163.org/course/NJUTCM-1001754311"},
    {"id":"tuina","topic":"tuina","title":"推拿学","url":"https://www.icourse163.org/course/NJUTCM-1466083224"},
    {"id":"inorganic-chemistry","topic":"inorganic-chemistry","title":"无机化学","url":"https://www.icourse163.org/course/DLUT-1001630001"},
    {"id":"chemical-engineering","topic":"chemical-engineering","title":"化工导论","url":"https://www.icourse163.org/course/TJU-1002579002"},
    {"id":"university-chemistry","topic":"university-chemistry","title":"大学化学","url":"https://www.icourse163.org/course/TJU-1002533008"},
    {"id":"preschool-education","topic":"preschool-education","title":"学前教育学","url":"https://www.icourse163.org/course/SWU-1002527012"},
    {"id":"child-psychology","topic":"child-psychology","title":"学前儿童发展心理学","url":"https://www.icourse163.org/course/detail.htm?cid=1452100178"},
    {"id":"diagnostics","topic":"diagnostics","title":"诊断学","url":"https://www.icourse163.org/course/detail.htm?cid=1450304205"},
    {"id":"medical-imaging","topic":"medical-imaging","title":"医学影像诊断学","url":"https://www.icourse163.org/course/NMU-1449922190"},
    {"id":"preventive-medicine","topic":"preventive-medicine","title":"预防医学","url":"https://www.icourse163.org/course/1004FDU001A-20015"},
    {"id":"biochemistry","topic":"biochemistry","title":"生物化学","url":"https://www.icourse163.org/course/CMU-1002125003"},
    {"id":"medical-nursing","topic":"medical-nursing","title":"内科护理学","url":"https://www.icourse163.org/course/SYSU-1003467010"},
    {"id":"education","topic":"education","title":"教育学原理","url":"https://www.icourse163.org/course/detail.htm?cid=1450290442"},
    {"id":"psychology","topic":"psychology","title":"心理学入门","url":"https://www.icourse163.org/course/detail.htm?cid=1002525010"},
    {"id":"ancient-chinese-literature","topic":"ancient-chinese-literature","title":"中国古代文学","url":"https://www.icourse163.org/course/NJNU-1001754077"},
    {"id":"modern-chinese","topic":"modern-chinese","title":"现代汉语","url":"https://www.icourse163.org/course/HRBNU-1471185177"},
    {"id":"marketing","topic":"marketing","title":"市场营销学","url":"https://www.icourse163.org/course/detail.htm?cid=1450262184"},
    {"id":"tourism","topic":"tourism","title":"旅游学概论","url":"https://www.icourse163.org/course/detail.htm?cid=1002127013"},
    {"id":"comprehensive-english","topic":"comprehensive-english","title":"综合英语","url":"https://www.icourse163.org/course/csu-1003376007"},
    {"id":"international-trade","topic":"international-trade","title":"国际贸易实务","url":"https://www.icourse163.org/course/SJU-1471601162"}
  ]$resources$::jsonb) as x(id text, topic text, title text, url text)
)
insert into public.resources (
  resource_id, topic_tags, title, platform, creator, url, resource_type,
  difficulty, duration_text, recommendation_reason, priority, verified_at, status
)
select 'res-b10-' || id, array[topic], title, '中国大学MOOC', '课程页教学团队', url,
  '系统课程', '入门', '完整学期', '课程内容覆盖对应官方考纲的主要知识模块，可用于系统复习与查漏补缺',
  1, date '2026-10-03', 'published'
from source;

do $$
declare
  draft_offerings integer;
  draft_points integer;
begin
  select count(*) into draft_offerings from public.admission_offerings where status = 'draft';
  select count(*) into draft_points from public.syllabus_points where status = 'draft';
  if draft_offerings <> 4 or draft_points <> 33 then
    raise exception 'Batch ten stopped: draft counts changed (% offerings, % points)', draft_offerings, draft_points;
  end if;
  if exists (
    (select row_data from batch_ten_protected_offering_drafts except select to_jsonb(o) from public.admission_offerings o where o.status = 'draft')
    union all
    (select to_jsonb(o) from public.admission_offerings o where o.status = 'draft' except select row_data from batch_ten_protected_offering_drafts)
  ) or exists (
    (select row_data from batch_ten_protected_point_drafts except select to_jsonb(p) from public.syllabus_points p where p.status = 'draft')
    union all
    (select to_jsonb(p) from public.syllabus_points p where p.status = 'draft' except select row_data from batch_ten_protected_point_drafts)
  ) then
    raise exception 'Batch ten stopped: protected draft content changed';
  end if;
  if (select count(*) from public.admission_offerings where status = 'published') <> 67 then
    raise exception 'Batch ten stopped: published offering count is not 67';
  end if;
  if (select count(distinct school_slug) from public.admission_offerings where status = 'published') <> 31 then
    raise exception 'Batch ten stopped: complete school map count is not 31';
  end if;
  if exists (
    select 1 from public.syllabus_points p
    where p.status = 'published'
      and not exists (select 1 from public.resources r where r.status = 'published' and p.canonical_topic = any(r.topic_tags))
  ) then
    raise exception 'Batch ten stopped: published knowledge points lack resources';
  end if;
  if exists (
    select lower(url) from public.resources where status = 'published'
    group by lower(url) having count(*) > 1
  ) then
    raise exception 'Batch ten stopped: duplicate published resource URL';
  end if;
  if exists (select 1 from public.admission_offerings where year = 2027 and status <> 'draft') then
    raise exception 'Batch ten stopped: non-draft 2027 offering detected';
  end if;
  if exists (select 1 from public.admission_offerings where school_slug = 'hfcity' and status = 'published') then
    raise exception 'Batch ten stopped: Hefei City University must remain unpublished';
  end if;
end $$;

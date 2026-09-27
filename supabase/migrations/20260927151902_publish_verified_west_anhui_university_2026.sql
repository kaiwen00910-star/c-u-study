-- Publish the 2026 West Anhui University network engineering study map after
-- checking the official charter page and the school-hosted 16-page syllabus.
-- The admissions subdomain currently serves these public files reliably over
-- HTTP while its HTTPS endpoint has a TLS fault; no login or captcha is used.

set lock_timeout = '5s';

alter table public.admission_offerings
  drop constraint admission_offerings_published_complete;

alter table public.admission_offerings
  add constraint admission_offerings_published_complete check (
    status <> 'published'
    or (
      (charter_url ~ '^https://' or charter_url ~ '^http://zsb\.wxc\.edu\.cn/')
      and (syllabus_url ~ '^https://' or syllabus_url ~ '^http://zsb\.wxc\.edu\.cn/')
      and verified_at is not null
      and btrim(source_status) <> ''
      and source_status <> '等待新年度官方文件核验'
    )
  );

update public.academic_schools
set school_slug = 'wxc', theme_color = '#1556a6'
where school_id = 'anhui-school-21' and school_slug = 'anhui-school-21';

insert into public.admission_offerings (
  offering_id, year, province_slug, major_slug, school_slug, training_site,
  eligible_major_categories, public_subjects, professional_subjects, plan_count,
  charter_url, syllabus_url, source_status, verified_at, active, status, sort_order
) values (
  'wxc-network-2026', 2026, 'anhui', 'computer-science', 'wxc',
  '网络工程：皖西学院本部（安徽省六安市云露桥西月亮岛）',
  '资源环境与安全大类、能源动力与材料大类、土木建筑大类、水利大类、装备制造大类、交通运输大类、电子与信息大类',
  array['高等数学','英语'], array['计算机网络','C语言程序设计'], 50,
  'http://zsb.wxc.edu.cn/2026/0319/c270a211177/page.htm',
  'http://zsb.wxc.edu.cn/_upload/article/files/8b/4f/53caeb5d4bb18157fd3e1db9625d/40a7ba02-ea56-4257-b910-508297c2d7f6.pdf',
  '2026正式章程与官方考纲（官方招生网 HTTP 入口）', '2026-09-27', true, 'published', 24
);

insert into public.syllabus_points (
  point_id, year, province_slug, major_slug, school_slug, subject_slug, subject_name,
  section_order, section_name, point_order, point_title, canonical_topic, active, status
) values
  ('wxc-net-overview', 2026, 'anhui', 'computer-science', 'wxc', 'computer-network', '计算机网络', 1, '网络基础与体系结构', 1, '计算机网络定义、组成、分类与拓扑结构', 'network-basic', true, 'published'),
  ('wxc-net-data', 2026, 'anhui', 'computer-science', 'wxc', 'computer-network', '计算机网络', 1, '网络基础与体系结构', 2, '数据通信、编码、传输指标、复用与交换技术', 'network-data', true, 'published'),
  ('wxc-net-model', 2026, 'anhui', 'computer-science', 'wxc', 'computer-network', '计算机网络', 1, '网络基础与体系结构', 3, '网络协议要素、OSI模型与TCP/IP体系结构', 'network-basic', true, 'published'),
  ('wxc-net-lan', 2026, 'anhui', 'computer-science', 'wxc', 'computer-network', '计算机网络', 2, '局域网与交换', 1, '局域网拓扑、传输介质、布线标准与CSMA/CD', 'network-data', true, 'published'),
  ('wxc-net-switching', 2026, 'anhui', 'computer-science', 'wxc', 'computer-network', '计算机网络', 2, '局域网与交换', 2, '交换机转发、VLAN、STP、Trunk与链路聚合', 'network-basic', true, 'published'),
  ('wxc-net-ip', 2026, 'anhui', 'computer-science', 'wxc', 'computer-network', '计算机网络', 3, '网络层与传输层', 1, 'IP地址分类、子网划分、子网掩码与ARP', 'network-ip', true, 'published'),
  ('wxc-net-routing', 2026, 'anhui', 'computer-science', 'wxc', 'computer-network', '计算机网络', 3, '网络层与传输层', 2, '路由、自主系统、RIP、OSPF与IPv6', 'network-ip', true, 'published'),
  ('wxc-net-transport', 2026, 'anhui', 'computer-science', 'wxc', 'computer-network', '计算机网络', 3, '网络层与传输层', 3, 'TCP与UDP、连接管理及拥塞控制', 'network-transport', true, 'published'),
  ('wxc-net-vpn-nat', 2026, 'anhui', 'computer-science', 'wxc', 'computer-network', '计算机网络', 3, '网络层与传输层', 4, 'VPN分类与NAT原理及类型', 'network-ip', true, 'published'),
  ('wxc-net-services-wlan', 2026, 'anhui', 'computer-science', 'wxc', 'computer-network', '计算机网络', 4, '网络服务与安全', 1, 'DNS、WWW、电子邮件、FTP与无线局域网', 'network-basic', true, 'published'),
  ('wxc-net-security', 2026, 'anhui', 'computer-science', 'wxc', 'computer-network', '计算机网络', 4, '网络服务与安全', 2, '网络安全威胁、DoS、防火墙与密码体制', 'information-security', true, 'published'),
  ('wxc-c-overview', 2026, 'anhui', 'computer-science', 'wxc', 'c-language', 'C语言程序设计', 1, '程序设计基础', 1, '程序设计概念、程序结构、算法与结构化设计', 'c-language-basic', true, 'published'),
  ('wxc-c-basic-io', 2026, 'anhui', 'computer-science', 'wxc', 'c-language', 'C语言程序设计', 1, '程序设计基础', 2, '数据类型、运算符、表达式、语句与输入输出', 'c-language-basic', true, 'published'),
  ('wxc-c-control', 2026, 'anhui', 'computer-science', 'wxc', 'c-language', 'C语言程序设计', 1, '程序设计基础', 3, '关系与逻辑运算、if与switch选择结构', 'c-language-control', true, 'published'),
  ('wxc-c-loop', 2026, 'anhui', 'computer-science', 'wxc', 'c-language', 'C语言程序设计', 1, '程序设计基础', 4, 'while、do-while、for循环及break与continue', 'c-language-control', true, 'published'),
  ('wxc-c-array', 2026, 'anhui', 'computer-science', 'wxc', 'c-language', 'C语言程序设计', 2, '数组与函数', 1, '一维数组、二维数组与字符数组', 'c-language-array', true, 'published'),
  ('wxc-c-function', 2026, 'anhui', 'computer-science', 'wxc', 'c-language', 'C语言程序设计', 2, '数组与函数', 2, '函数定义调用、递归及局部与全局变量', 'c-language-array', true, 'published'),
  ('wxc-c-pointer', 2026, 'anhui', 'computer-science', 'wxc', 'c-language', 'C语言程序设计', 3, '指针与复合类型', 1, '指针、数组与字符串指针、函数指针和多级指针', 'c-language-pointer', true, 'published'),
  ('wxc-c-struct', 2026, 'anhui', 'computer-science', 'wxc', 'c-language', 'C语言程序设计', 3, '指针与复合类型', 2, '结构体、链表、共用体、枚举与typedef', 'c-language-pointer', true, 'published');

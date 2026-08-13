insert into public.resources
  (resource_id, topic_tags, title, platform, creator, url, resource_type, difficulty, duration_text, recommendation_reason, priority, verified_at, status)
values
  ('res-math-1', array['math-function','math-limit','math-derivative','math-integral'], '高等数学（一）', '中国大学MOOC', '同济大学', 'https://www.icourse163.org/course/TONGJI-53004', '系统课程', '入门', '完整学期', '国家精品在线开放课程，适合按章节建立微积分基础', 1, '2026-08-13', 'active'),
  ('res-math-2', array['math-function','math-limit','math-derivative','math-integral'], '《高等数学》全程教学视频 2.0版', '哔哩哔哩', '宋浩老师官方', 'https://www.bilibili.com/video/BV1CAxaeHEeH/', '系统课程', '零基础', '149讲', '函数极限导数和积分目录完整，讲解细致且方便反复观看', 2, '2026-08-13', 'active'),
  ('res-english-1', array['english-grammar','english-reading'], '四六级、考研英语语法零基础急速通关', '哔哩哔哩', '晓艳教英语', 'https://www.bilibili.com/video/BV1eC1WBgE2G/', '系统课程', '零基础', '6个专题约24小时', '从简单句讲到从句和长难句，适合补语法并提升阅读拆句能力', 1, '2026-08-13', 'active'),
  ('res-english-2', array['english-vocabulary','english-grammar','english-reading','english-writing'], '零基础英语：基础、语法与做题技巧', '哔哩哔哩', '尚德机构自考官方号', 'https://www.bilibili.com/video/BV18YtnzbEGS/', '专项课程', '零基础', '20讲', '内容覆盖语法翻译做题技巧和写作，与学历提升英语备考较贴近', 2, '2026-08-13', 'active'),
  ('res-c-1', array['c-language-basic','c-language-control','c-language-array','c-language-pointer'], '黑马程序员C语言零基础入门到精通', '哔哩哔哩', '黑马程序员', 'https://www.bilibili.com/video/BV1Xa4y1k7LU/', '系统课程', '零基础', '165讲', '从环境搭建讲到指针与内存管理，内容完整且明确适用于专升本复习', 1, '2026-08-13', 'active'),
  ('res-c-2', array['c-language-basic','c-language-control','c-language-array','c-language-pointer'], 'C语言学习：鹏哥带你从入门到进阶', '哔哩哔哩', '比特就业课·鹏哥', 'https://www.bilibili.com/video/BV1TT4y1F7Z9/', '系统课程', '系统学习', '231讲', '作为第二种讲解思路，适合跟练基础语法并攻克数组函数和指针', 2, '2026-08-13', 'active'),
  ('res-ds-1', array['data-structure-linear','data-structure-tree','data-structure-graph','data-structure-sort'], '数据结构与算法基础', '哔哩哔哩', '王卓老师', 'https://www.bilibili.com/video/BV1Ts411c7ZX/', '系统课程', '零基础', '173讲', '王卓老师本人发布，按线性表栈队列树图查找和排序组织内容', 1, '2026-08-13', 'active'),
  ('res-ds-2', array['data-structure-linear','data-structure-tree','data-structure-graph','data-structure-sort'], '浙江大学数据结构', '哔哩哔哩', '陈越·何钦铭', 'https://www.bilibili.com/video/BV1qU4y1v7p2/', '系统课程', '系统学习', '149讲', '章节短而清楚，适合在王卓课程之外补充算法思路与实现方法', 2, '2026-08-13', 'active'),
  ('res-basic-1', array['computer-basics','computer-office'], '大学计算机基础', '中国大学MOOC', '中原工学院', 'https://www.icourse163.org/course/detail.htm?cid=1001796021', '系统课程', '零基础', '完整学期', '具体课程页可直接查看大纲，覆盖系统组成信息编码操作系统和办公软件', 1, '2026-08-13', 'active'),
  ('res-basic-2', array['computer-basics','network-basic'], '信息技术1（计算机基础）', '中国大学MOOC', '北京航空航天大学', 'https://www.icourse163.org/course/detail.htm?cid=1002188002', '系统课程', '零基础', '完整学期', '具体课程页覆盖计算机原理软件平台网络平台与数据处理基础', 2, '2026-08-13', 'active'),
  ('res-basic-3', array['computer-basics','computer-office'], '1小时搞定大学计算机基础', '哔哩哔哩', '计算机二级小黑课堂', 'https://www.bilibili.com/video/BV1ft411Q76N/', '冲刺课程', '快速复习', '约1小时', '适合学完系统课程后快速串联计算机基础与Office常考内容', 3, '2026-08-13', 'active'),
  ('res-network-1', array['network-basic','network-data','network-ip','network-transport'], '计算机网络微课堂（有字幕无背景音乐版）', '哔哩哔哩', '湖科大教书匠', 'https://www.bilibili.com/video/BV1c4411d7jb/', '系统课程', '零基础', '73讲', 'UP主本人发布，用动画讲解分层协议局域网IP和TCP等抽象概念', 1, '2026-08-13', 'active')
on conflict (resource_id) do update set
  topic_tags = excluded.topic_tags,
  title = excluded.title,
  platform = excluded.platform,
  creator = excluded.creator,
  url = excluded.url,
  resource_type = excluded.resource_type,
  difficulty = excluded.difficulty,
  duration_text = excluded.duration_text,
  recommendation_reason = excluded.recommendation_reason,
  priority = excluded.priority,
  verified_at = excluded.verified_at,
  status = excluded.status;

insert into public.announcements (title, content, enabled)
select '欢迎使用升本导航', '学习资源会持续核验和补充，报考信息请始终以学校及考试院最新通知为准。', false
where not exists (select 1 from public.announcements);

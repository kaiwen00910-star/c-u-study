-- Remote migration version: 20260919170815.
-- Use the stable official article as the public syllabus entry point.
-- The article lists the official computer-major PDF, whose download endpoint may
-- intermittently return the university's anti-automation verification page.
update public.admission_offerings
set syllabus_url = 'https://zsb.hblgxy.edu.cn/info/1020/2361.htm'
where year = 2026
  and province_slug = 'anhui'
  and major_slug = 'computer-science'
  and school_slug = 'hblg';

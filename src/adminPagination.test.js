import { describe, expect, it, vi } from 'vitest'
import {
  ADMIN_PAGE_SIZE, adminPageRange, loadResourceAdminPage, loadSyllabusAdminPage,
  isStaleReview, staleReviewLabel, totalAdminPages, updateAdminSearchParams,
} from './adminPagination'

function mockClient(result = { data: [], count: 0, error: null }) {
  const range = vi.fn().mockResolvedValue(result)
  const rpc = vi.fn().mockReturnValue({ range })
  return { client: { rpc }, rpc, range }
}

describe('Supabase 服务端分页', () => {
  it('资源查询使用每页 20 条的 range 和精确 count', async () => {
    const { client, rpc, range } = mockClient({ data: [{ resource_id: 'r-21' }], count: 45, error: null })
    const result = await loadResourceAdminPage(client, { query: '指针', platform: '哔哩哔哩', status: 'published', issueFilter: 'stale', page: 2 })
    expect(rpc).toHaveBeenCalledWith('admin_resources_page', {
      p_query: '指针', p_platform: '哔哩哔哩', p_status: 'published', p_filter: 'stale',
    }, { count: 'exact' })
    expect(range).toHaveBeenCalledWith(20, 39)
    expect(result.count).toBe(45)
  })

  it('考纲查询把搜索、状态和体检筛选交给数据库', async () => {
    const { client, rpc, range } = mockClient({ data: [], count: 0, error: null })
    await loadSyllabusAdminPage(client, { query: 'canonical', status: 'draft', issueFilter: 'draft-no-resource', page: 1 })
    expect(rpc).toHaveBeenCalledWith('admin_syllabus_page', {
      p_query: 'canonical', p_status: 'draft', p_filter: 'draft-no-resource',
    }, { count: 'exact' })
    expect(range).toHaveBeenCalledWith(0, ADMIN_PAGE_SIZE - 1)
  })

  it('支持空结果、最后一页和超出页码归一化所需的边界', () => {
    expect(totalAdminPages(0)).toBe(1)
    expect(totalAdminPages(41)).toBe(3)
    expect(adminPageRange(3)).toEqual({ from: 40, to: 59 })
  })

  it('切换筛选时回到第 1 页，URL 刷新所需筛选仍保留', () => {
    const next = updateAdminSearchParams(new URLSearchParams('filter=stale&page=4'), 'status', 'published')
    expect(next.toString()).toContain('filter=stale')
    expect(next.toString()).toContain('status=published')
    expect(next.has('page')).toBe(false)
  })
})

describe('stale 复核口径', () => {
  it('使用与数据库相同的上海自然日边界：第 90 天不超期、第 91 天超期', () => {
    expect(isStaleReview('2026-01-01', new Date('2026-04-01T15:59:59Z'))).toBe(false)
    expect(isStaleReview('2026-01-01', new Date('2026-04-01T16:00:00Z'))).toBe(true)
  })

  it('明确区分草稿待核验和已发布内容过期', () => {
    expect(staleReviewLabel({ status: 'draft', verified_at: null })).toBe('草稿待核验')
    expect(staleReviewLabel({ status: 'published', verified_at: '2020-01-01' })).toBe('已发布内容过期')
  })
})

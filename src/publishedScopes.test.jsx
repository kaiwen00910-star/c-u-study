// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./publicApi', () => ({ loadPublishedScopes: vi.fn() }))
vi.mock('./useContent', () => ({
  useContent: () => ({
    resources: [], announcement: null, academicSchools: [], offerings: [], syllabusPoints: [],
    metadata: {}, source: 'database', loading: false, offline: false, error: null,
  }),
}))

import { PublicSite } from './App'
import { loadPublishedScopes } from './publicApi'

const scope2026 = { year: 2026, provinceSlug: 'anhui', majorSlug: 'computer-science' }
const scope2027 = { year: 2027, provinceSlug: 'anhui', majorSlug: 'computer-science' }

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}</output>
}

function renderPublic(path) {
  return render(<MemoryRouter initialEntries={[path]}><PublicSite /><LocationProbe /></MemoryRouter>)
}

describe('动态已发布年份加载', () => {
  beforeEach(() => { loadPublishedScopes.mockReset() })
  afterEach(cleanup)

  it('远程 2027 已发布时直接访问 2027 不会被降级', async () => {
    loadPublishedScopes.mockResolvedValue([scope2027, scope2026])
    renderPublic('/anhui/2027/computer-science')
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/anhui/2027/computer-science'))
    await waitFor(() => expect(screen.queryByText('正在加载已发布年份…')).not.toBeInTheDocument())
  })

  it('/anhui 自动进入数据库最新的已发布年份', async () => {
    loadPublishedScopes.mockResolvedValue([scope2026, scope2027])
    renderPublic('/anhui')
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/anhui/2027/computer-science'))
  })

  it('加载期间不提前重定向', async () => {
    let resolve
    loadPublishedScopes.mockReturnValue(new Promise((done) => { resolve = done }))
    renderPublic('/anhui/2027/computer-science')
    expect(screen.getByText('正在加载已发布年份…')).toBeVisible()
    expect(screen.getByTestId('location')).toHaveTextContent('/anhui/2027/computer-science')
    await act(async () => resolve([scope2027, scope2026]))
    await waitFor(() => expect(screen.queryByText('正在加载已发布年份…')).not.toBeInTheDocument())
    expect(screen.getByTestId('location')).toHaveTextContent('/anhui/2027/computer-science')
  })

  it('查询失败时使用版本化 2026 快照', async () => {
    loadPublishedScopes.mockReturnValue({
      then: () => ({ catch: (reject) => reject(new Error('network failed')) }),
    })
    renderPublic('/anhui')
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/anhui/2026/computer-science'))
  })

  it('访问未发布年份时安全降级到最新已发布年份', async () => {
    loadPublishedScopes.mockResolvedValue([scope2027, scope2026])
    renderPublic('/anhui/2028/computer-science')
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/anhui/2027/computer-science'))
  })
})

import assert from 'node:assert/strict'

/** Read the actual containing-block/scroll chain, never mutate layout to make a test pass. */
export async function scrollGeometry(page) {
  return page.evaluate(() => {
    const selectors = ['.wd-root', '.wd-main', '.wd-content', '.wd-bench-page', '.fw-shell', '.wd-fw', '.fw-grid']
    return selectors.map(selector => {
      const el = document.querySelector(selector)
      if (!el) return { selector, missing: true }
      const rect = el.getBoundingClientRect()
      const css = getComputedStyle(el)
      return { selector, top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height), clientHeight: el.clientHeight, scrollHeight: el.scrollHeight, scrollTop: el.scrollTop, position: css.position, overflowY: css.overflowY, cssHeight: css.height }
    })
  })
}

/** Normal Playwright scrolling and click; no forced events or Host resize substitute. */
export async function clickEditorControl(page, locator) {
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 6000 })
    const button = await locator.boundingBox()
    const viewport = page.viewportSize()
    assert.ok(button && button.y >= 0 && button.y + button.height <= viewport.height + 1, `Control outside viewport: ${JSON.stringify(button)}`)
    await locator.click({ timeout: 6000 })
  } catch (error) {
    error.message += `\nHeight/scroll chain: ${JSON.stringify(await scrollGeometry(page))}`
    throw error
  }
  const chain = await scrollGeometry(page)
  const pageBox = chain.find(row => row.selector === '.wd-bench-page')
  const shell = chain.find(row => row.selector === '.fw-shell')
  const grid = chain.find(row => row.selector === '.fw-grid')
  assert.ok(grid.height > 0 && grid.bottom <= pageBox.bottom + 1 && shell.bottom <= pageBox.bottom + 1, `Grid/shell escaped page: ${JSON.stringify(chain)}`)
}

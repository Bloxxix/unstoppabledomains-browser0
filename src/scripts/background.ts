import '../subscripts/onInstalled'
import isValidDNSHostname from '../util/isValidDNSHostname';
import { redirectToIpfs, supportedDomain, supportedDomains } from '../util/helpers'
import { searchEngines, SearchEngine } from '../util/searchEngines'
import OAURL from '../util/OsAgnosticURL';
chrome.webRequest.onBeforeRequest.addListener(
  requestDetails => {
    const url = new URL(requestDetails.url)
    const searchEngine = searchEngines.find(se => url.hostname.includes(se.hostname));
    if (!searchEngine) return

    const params = url.searchParams
      .get(searchEngine.param)
      .trim()
      .toLowerCase()
    const q = new OAURL(url.protocol + '//' + params)
    if (
      !q.hostname() ||
      !isValidDNSHostname(q.hostname()) ||
      !supportedDomain(q.hostname())
    ) {
      return
    }

    if (q.hostname().endsWith('.888')) {
      chrome.tabs.update(
        { url: 'index.html#loading' },
        async (tab: chrome.tabs.Tab) => {
            await redirectToIpfs(q.toString(), tab.id)
          return { cancel: true }
        },
      )
      return {cancel: true}
    }
    chrome.tabs.update({ url: q.toString() })
    return { cancel: true }
  },
  {
    urls: searchEngines.map((se: SearchEngine): string => `*://*.${se.hostname}/*`),
    types: ['main_frame'],
  },
  ['blocking'],
)

chrome.webRequest.onBeforeRequest.addListener(
  requestDetails => {
    chrome.tabs.update(
      { url: 'index.html#loading' },
      async (tab: chrome.tabs.Tab) => {
          await redirectToIpfs(requestDetails.url, tab.id)
        return { cancel: true }
      },
    )
  },
  {
    urls: supportedDomains.map((d: string): string => `*://*${d}/*`),
    types: ['main_frame'],
  },
  ['blocking'],
)

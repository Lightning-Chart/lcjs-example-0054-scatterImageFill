window.lcjsSmallView = window.devicePixelRatio >= 2
if (!window.__lcjsDebugOverlay) {
    window.__lcjsDebugOverlay = document.createElement('div')
    window.__lcjsDebugOverlay.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;z-index:99999;font:12px monospace;pointer-events:none'
    const attach = () => { if (document.body && !window.__lcjsDebugOverlay.parentNode) document.body.appendChild(window.__lcjsDebugOverlay) }
    attach()
    setInterval(() => {
        attach()
        window.__lcjsDebugOverlay.textContent = window.innerWidth + 'x' + window.innerHeight + ' dpr=' + window.devicePixelRatio + ' small=' + window.lcjsSmallView
    }, 500)
}
const lcjs = require('@lightningchart/lcjs')
const { lightningChart, Themes, emptyFill, AxisTickStrategies, AxisScrollStrategies, DashedLine, emptyLine, ImageFill } = lcjs

const exampleContainer = document.getElementById('chart') || document.body
if (exampleContainer === document.body) {
    exampleContainer.style.width = '100vw'
    exampleContainer.style.height = '100vh'
    exampleContainer.style.margin = '0px'
}
const containerChart1 = document.createElement('div')
const containerChart2 = document.createElement('div')
exampleContainer.append(containerChart1)
exampleContainer.append(containerChart2)
containerChart1.style.width = '100%'
containerChart1.style.height = '70%'
containerChart2.style.width = '100%'
containerChart2.style.height = '30%'

const threshold = 70

const lc = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
const chart = lc.ChartXY({
    legend: { visible: false },
    container: containerChart1,
    theme: (() => {
    const t = Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined
    return t && window.lcjsSmallView ? lcjs.scaleTheme(t, 0.5) : t
})(),
textRenderer: window.lcjsSmallView ? lcjs.htmlTextRenderer : undefined,
})
const timeAxis = chart
    .getDefaultAxisX()
    .setTickStrategy(AxisTickStrategies.Time)
    .setScrollStrategy(AxisScrollStrategies.scrolling)
    .setDefaultInterval((state) => ({
        end: state.dataMax ?? 0,
        start: (state.dataMax ?? 0) - 15_000,
        stopAxisAfter: false,
    }))
const axisY = chart.getDefaultAxisY().setDefaultInterval({ start: 0, end: 100 })

const eventSeries = chart.addPointSeries().setAutoScrollingEnabled(false).setCursorEnabled(false)
const warningImage = new Image()
warningImage.crossOrigin = ''
warningImage.src = document.head.baseURI + 'examples/assets/0054/warning.png'
eventSeries
    .setPointFillStyle(new ImageFill({ source: warningImage }))
    .setPointAlignment({ x: 0, y: -1.1 })
    .setPointSize(0.8)

const lineSeries = chart.addPointLineSeries().setMaxSampleCount(100_000)
axisY
    .addConstantLine()
    .setValue(threshold)
    .setStrokeStyle((stroke) => new DashedLine({ fillStyle: stroke.getFillStyle() }))

const zoomBandChart = lc.ZoomBandChart({ container: containerChart2 })
zoomBandChart.add(eventSeries).setAutoScrollingEnabled(false).setPointAlignment({ x: 0, y: -1.1 }).setPointSize(0.5)
zoomBandChart.add(lineSeries)
zoomBandChart.getDefaultAxisY().setInterval({ start: 0, end: 100 })

let yPrev = 50
setInterval(() => {
    const x = performance.now()
    const y = yPrev + (Math.random() - 0.4)
    lineSeries.appendSample({ x, y })
    yPrev = y
    if (y > threshold) {
        yPrev *= Math.random()
        // Add automatically generated event indicator at X + Y location.
        eventSeries.appendSample({ x, y })
    }
}, 1000 / 60)

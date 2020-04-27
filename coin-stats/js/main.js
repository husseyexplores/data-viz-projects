/*
*    main.js
*    Mastering Data Visualization with D3.js
*    CoinStats
*/
(() => {


  // Time parser for x-scale
  let parseDate = d3.timeParse('%d/%m/%Y');
  let formatDate = d3.timeFormat('%d/%m/%Y')

  const t = () => d3.transition().duration(500)

  const selectors = {
    coin: document.querySelector('#coin-select'),
    stat: document.querySelector('#stat-select'),
    dateRange: document.querySelector('#date-slider'),
    dateMinLabel: document.querySelector('#dateLabel1'),
    dateMaxLabel: document.querySelector('#dateLabel2'),
  }

  const state = {
    coin: selectors.coin.value,
    stat: selectors.stat.value,
    dateRange: [parseDate('12/5/2013'), parseDate('31/10/2017')], // [start, end] date,
    data: null,
    allData: null,
    getData() {
      return this.allData[state.coin]
    }
  }

  /* Canvas */
  let margin = { left: 80, right: 100, top: 50, bottom: 100 }
  let height = 500 - margin.top - margin.bottom
  let width = 800 - margin.left - margin.right

  let svg = d3.select('#chart-area').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  let g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // For tooltip
  let bisectDate = d3.bisector(d => d.date).left;

  // Scales
  let x = d3.scaleTime().range([0, width]);
  let y = d3.scaleLinear().range([height, 0]);

  // Axis generators
  let xAxisCall = d3.axisBottom().ticks(4)
  let yAxisCall = d3.axisLeft()
    .ticks(6)
    .tickFormat(formatAbbreviation);

  // Axis groups
  let xAxis = g.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0, ${height})`);
  let yAxis = g.append('g')
    .attr('class', 'y axis')

  // Y-Axis label
  const $yLabel = yAxis.append('text')
    .attr('class', 'axis-title')
    .attr('transform', 'rotate(-90)')
    .attr('y', -60)
    .attr('x', -height / 2)
    .style('text-anchor', 'middle')
    .attr('font-size', 20)
    .attr('fill', '#222')
    .text(getYLabelText(state.stat));

  // X-Axis label
  const $xLabel = yAxis.append('text')
    .attr('class', 'axis-title')
    .attr('y', height + 50)
    .attr('x', width / 2)
    .style('text-anchor', 'middle')
    .attr('font-size', 20)
    .attr('fill', '#222')
    .text('Time');

  // Line path generator
  let generateLine = d3.line()
    .x(d => x(d.date))
    .y(d => y(d[state.stat]));

  // Add line to chart
  const $line = g.append('path')
    .attr('class', 'line')
    .attr('fill', 'none')
    .attr('stroke', 'grey')
    .attr('stroke-with', '3px')

  initializeDateSlider()

  d3.json('data/coins.json').then(_data => {
    state.allData = cleanData(_data)
    update()
  });

  function update() {
    const data = state.getData()
    const [minDate, maxDate] = state.dateRange
    const filteredData = data.filter(d => d.date >= minDate && d.date <= maxDate)

    // Set scale domains
    x.domain(d3.extent(filteredData, d => d.date));
    y.domain([d3.min(filteredData, d => d[state.stat]) / 1.005, d3.max(filteredData, d => d[state.stat]) * 1.005]);

    // Update Y-label
    $yLabel.text(getYLabelText(state.stat))

    // Generate axes once scales have been set
    xAxis.transition(t()).call(xAxisCall.scale(x))
    yAxis.transition(t()).call(yAxisCall.scale(y))

    // Update line path
    $line.transition(t()).attr('d', generateLine(filteredData));
  }

  /******************************** Tooltip Code ********************************/

  let $focus = g.append('g')
    .attr('class', 'focus')
    .style('display', 'none');

  $focus.append('line')
    .attr('class', 'x-hover-line hover-line')
    .attr('y1', 0)
    .attr('y2', height);

  $focus.append('line')
    .attr('class', 'y-hover-line hover-line')
    .attr('x1', 0)
    .attr('x2', width);

  $focus.append('circle')
    .attr('r', 7.5);

  $focus.append('text')
    .attr('x', 0)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .attr('dy', '.31em')

  g.append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .on('mouseover', () => $focus.style('display', null))
    .on('mouseout', () => $focus.style('display', 'none'))
    .on('mousemove', mousemove);

  function mousemove() {
    let data = state.getData()

    let x0 = x.invert(d3.mouse(this)[0]);
    let i = bisectDate(data, x0, 1);
    let d0 = data[i - 1];
    let d1 = data[i];
    let d = x0 - d0.date > d1.date - x0 ? d1 : d0;

    $focus.attr('transform', `translate(${x(d.date)}, ${y(d[state.stat])})`);
    $focus.select('text').text(d[state.stat]);
    $focus.select('.x-hover-line').attr('y2', height - y(d[state.stat]));
    $focus.select('.y-hover-line').attr('x2', -x(d.date));
  }


  /******************************** Tooltip Code ********************************/

  /* DOM Listeners */
  $(selectors.stat).change(function () {
    const value = $(this).val()
    state.stat = value
    update()
  })

  $(selectors.coin).change(function () {
    const value = $(this).val()
    state.coin = value
    update()
  })

  /******************************** Helpers ********************************/

  function cleanData(data) {
    const cleanedData = {}

    // data cleaning
    for (let key in data) {
      cleanedData[key] = []

      data[key].forEach(d => {
        if (d.market_cap != null && d['24h_vol'] != null && d.price_usd != null) {
          cleanedData[key].push({
            date: parseDate(d.date),
            '24h_vol': +d['24h_vol'],
            market_cap: +d.market_cap,
            price_usd: +d.price_usd,
          })
        }
      })
    }

    return cleanedData
  }

  function initializeDateSlider() {
    const $slider = $(selectors.dateRange)
    const $dateMinLabel = $(selectors.dateMinLabel)
    const $dateMaxLabel = $(selectors.dateMaxLabel)

    const min = parseDate('12/5/2013').getTime() // millisec
    const max = parseDate('31/10/2017').getTime() // millisec

    $slider.slider({
      range: true,
      min,
      max,
      step: 60 * 60 * 24 * 1000, // one day in millisec
      values: [min, max],
      slide: function (event, { values }) {
        const [smaller, higher] = values
        const newMin = formatDate(smaller)
        const newMax = formatDate(higher)

        $dateMinLabel.text(newMin)
        $dateMaxLabel.text(newMax)

        state.dateRange = [parseDate(newMin), parseDate(newMax)]
        update()
      }
    });

    // update initially
    $dateMinLabel.text(formatDate($slider.slider('values', 0)))
    $dateMaxLabel.text(formatDate($slider.slider('values', 1)))
  }

  const formatSi = d3.format(".2s");
  function formatAbbreviation(d) {
    const s = formatSi(d);
    switch (s[s.length - 1]) {
      case 'G': return s.slice(0, -1) + 'B';
      case 'k': return s.slice(0, -1) + 'K';
    }

    return s
  }

  function getYLabelText(stat) {
    switch (stat) {
      case "24h_vol": return "24 Hour Trading Volume (USD)"
      case "market_cap": return "Market Capitalization (USD)"
      case "price_usd": return "Price (USD)"
    }
  }

})()

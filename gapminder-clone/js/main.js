/*
*    main.js
*    Mastering Data Visualization with D3.js
*    Project 2 - Gapminder Clone
*/

const state = {
	currentIndex: 0,
	interval: null,
	continent: '',
	isPlaying: false,
}

d3.json("data/data.json").then(_data => {
	/* Data transformation */
	_data.forEach(d => {
		d._year = Number(d.year)
		d.countries = d.countries.filter(country => country.income && country.life_exp)
		// sort by population
		d.countries = d.countries.sort((a, b) => b.population - a.population)
	})
	window._data = _data
	const allData = _data

	// to be used in scales
	const incomeData = allData.map(d => d.countries.reduce((arr, country) => {
		arr.push(country.income);
		return arr;
	}, [])).flat(Infinity)

	const lifeExpectancyData = allData.map(d => d.countries.reduce((arr, country) => {
		arr.push(country.life_exp);
		return arr;
	}, [])).flat(Infinity)

	const populationData = allData.map(d => d.countries.reduce((arr, country) => {
		arr.push(country.population);
		return arr;
	}, [])).flat(Infinity)

	let continentsData = [... new Set(allData.map(d => d.countries.reduce((arr, country) => {
		arr.push(country.continent);
		return arr;
	}, [])).flat(Infinity))]

	/* Canvas */
	const margin = { top: 10, bottom: 250, left: 100, right: 10 }
	margin.x = margin.left + margin.right
	margin.y = margin.top + margin.bottom

	const CANVAS_WIDTH = 1200
	const CANVAS_HEIGHT = 800

	const $svg = d3.select('#chart-area')
		.append('svg')
		.attr('width', CANVAS_WIDTH)
		.attr('height', CANVAS_HEIGHT)

	/* Scene */
	const width = CANVAS_WIDTH - margin.x
	const height = CANVAS_HEIGHT - margin.y

	const $scene = $svg.append('g')
		.attr('width', width)
		.attr('height', height)
		.attr('transform', `translate(${margin.left}, ${margin.top})`)

	const $vizContainer = $scene.append('g')

	/* Scales */
	const xScale = d3.scaleLog()
		.base(10)
		.domain(d3.extent(incomeData))
		.range([0, width])

	const yScale = d3.scaleLinear()
		.domain([0, Math.max(d3.max(lifeExpectancyData), 90)])
		.range([height, 0])

	const sizeScale = d3.scaleLinear()
		.domain(d3.extent(populationData))
		.range([5, 80])

	const ordinalScale = d3.scaleOrdinal()
		.domain(continentsData)
		.range(d3.schemeCategory10)

	/* Axes */
	const xAxisCall = d3.axisBottom(xScale)
		.tickValues([300, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000])
		.tickFormat(d3.format('$'))

	const yAxisCall = d3.axisLeft(yScale)
		.tickFormat(d => parseInt(d, 10))

	const $xAxisGroup = $scene.append('g')
		.attr('transform', `translate(0, ${height})`)
		.call(xAxisCall)

	const $yAxisGroup = $scene.append('g')
		.call(yAxisCall)

	/* Axes Labels */
	const $labelsContainer = $scene.append('g')

	const $xLabel = $labelsContainer.append('text')
		.attr('transform', `rotate(-90) translate(-${height / 2}, -50)`)
		.attr('text-anchor', 'middle')
		.attr('font-size', 30)
		.text('Life Expectancy')

	const $yLabel = $labelsContainer.append('text')
		.attr('transform', `translate(${width / 2}, ${height + 70})`)
		.attr('text-anchor', 'middle')
		.attr('font-size', 30)
		.text('GDP Per Capita (USD)')

	/* Labels/Legends */
	const $yearLabel = $labelsContainer.append('text')
		.attr('transform', `translate(${width}, ${height - 20})`)
		.attr('text-anchor', 'end')
		.attr('font-size', 30)
		.attr('font-weight', 'bold')
		.text('')

	const $legendContainer = $scene.append('g')
		.attr('transform', `translate(${width / 2}, ${height + 120})`)
		.attr('transform', `translate(${width - 15}, ${height - 160})`)

	continentsData.forEach((continent, i) => {
		const $legendRow = $legendContainer.append('g')
			.attr('transform', `translate(0, ${i * 25})`)

		$legendRow.append('rect')
			.attr('width', 15)
			.attr('height', 15)
			.attr('fill', ordinalScale(continent))

		$legendRow.append('text')
			.attr('x', -10)
			.attr('y', 13)
			.attr('text-anchor', 'end')
			.style('text-transform', 'capitalize')
			.text(continent)
		})

	/* Update/render visualization */
	const formatCurrency = d3.format('$,.0f')
	const formatPopulation = d3.format(',.0f')
	const $tip = d3.tip().attr('class', 'd3-tip').html(d => `
		<div><strong style="color: skyblue;">Country:</strong> <span style="margin-left: 5px; font-weight: 400;">${d.country}</span></div>
		<div><strong style="color: skyblue;">Continent:</strong> <span style="margin-left: 5px; font-weight: 400;">${d.continent}</span></div>
		<div><strong style="color: skyblue;">Income:</strong> <span style="margin-left: 5px; font-weight: 400;">${formatCurrency(d.income)}</span></div>
		<div><strong style="color: skyblue;">Life Expectancy:</strong> <span style="margin-left: 5px; font-weight: 400;">${d.life_exp} years</span></div>
		<div><strong style="color: skyblue;">Population:</strong> <span style="margin-left: 5px; font-weight: 400;">${formatPopulation(d.population)}</span></div>
		<div><strong style="color: skyblue;">Year:</strong> <span style="margin-left: 5px; font-weight: 400;">${d.year}</span></div>
	`);
	$vizContainer.call($tip)

	function update(data) {
		const t = d3.transition().duration(100)
		$yearLabel.text(data.year)

		// Add year to each data point for easy access in d3 tip
		data.countries.forEach(d => {
			d.year = data.year
		})

		let _data = data.countries
		if (state.continent !== '') {
			_data = data.countries.filter(d => d.continent === state.continent)
		}

		/* remove/draw/update circles/bars/whatever */
		const $circles = $vizContainer.selectAll('circle')
			.data(_data, d => d.country)

		$circles.exit().remove()

		const $updateSelection = $circles.enter()
			.append('circle')
			.attr('fill', d => ordinalScale(d.continent))
			.attr('cx', d => xScale(d.income))
			.attr('cy', d => yScale(d.life_exp))
			.attr('r', d => sizeScale(d.population))
			.on('mouseover', $tip.show)
			.on('mouseout', $tip.hide)
			.merge($circles)

		$updateSelection.transition(t)
			.attr('cx', d => xScale(d.income))
			.attr('cy', d => yScale(d.life_exp))
			.attr('r', d => sizeScale(d.population))
			.attr('opacity', 0.5)
	}

	update(allData[state.currentIndex]) // initialize once instantly

	const yearToIndex = allData.reduce((map, d, idx) => {
		map[d.year] = idx
		return map
	}, {})

	/* Year Range Slider */
	const yearExtent = d3.extent(allData, d => +d.year)
	const updateSlider = makeRangeSlider({
		extent: yearExtent,
		startValue: yearExtent[0],
		width: 800,
		element: '#range',
		onChange: value => {
			state.currentIndex = yearToIndex[value]
			update(allData[state.currentIndex])

			handleTimer({ stop: true })
		},
		state,
	})

	/* Play-pause */
	const $btn = d3.select('#play-pause')
	$btn.on('click', () => {
		handleTimer()
	})

	function handleTimer({ play, stop } = {}) {
		const isPlaying = stop || state.isPlaying

		if (isPlaying) {
			// stop the loop
			clearInterval(state.interval)
			$btn.text('play')
		} else {
			// start the loop
			state.interval = setInterval(() => {
				state.currentIndex++;
				if (state.currentIndex >= allData.length) state.currentIndex = 0

				update(allData[state.currentIndex])
				updateSlider(allData[state.currentIndex].year)
			}, 100);
			$btn.text('pause')
		}

		state.isPlaying = !isPlaying
	}

	/* Filter */
	const $selectContinent = d3.select('#filter-continents')
		.on('change', () => {
			const value = $selectContinent.property('value')
			state.continent = value
			update(allData[state.currentIndex])
		})
})

/* https://bl.ocks.org/HarryStevens/d1bc769436b43438d9b02d25a3315e0d */
function makeRangeSlider({ extent, startValue, width = 600, element, onChange = () => {} }) {
	let sliderRadius = 50,
		currentValue = startValue ? startValue : extent[0],
		sliderPadding = 10,
		sliderHeight = 5,
		sliderAxisHeight = 20;

	let setup = d3.marcon()
		.width(800)
		.height(sliderRadius * 2 + sliderHeight + sliderPadding + sliderAxisHeight)
		.left(sliderRadius)
		.right(sliderRadius)
		.bottom(sliderAxisHeight)
		.element(element);

	setup.render();

	let rangeWidth = setup.innerWidth()
	let rangeHeight = setup.innerHeight()
	let rangeSvg = setup.svg();

	let range_x = d3.scaleLinear()
		.range([0, rangeWidth])
		.domain(extent);

	// the range axis
	rangeSvg.append("g")
		.attr("class", "range-axis")
		.attr("transform", "translate(0, " + rangeHeight + ")")
		.call(d3.axisBottom(range_x))

	// the range scale
	rangeSvg.append("rect")
		.attr("class", "range-body")
		.attr("x", 0)
		.attr("y", rangeHeight - sliderHeight)
		.attr("width", rangeWidth)
		.attr("height", sliderHeight);

	// the handle
	rangeSvg.append("circle")
		.attr("class", "range-dragger range-handle")
		.attr("tabindex", "0")
		.attr("cx", range_x(currentValue))
		.attr("cy", rangeHeight - sliderHeight - sliderRadius - sliderPadding)
		.attr("r", sliderRadius)
		.call(d3.drag()
			.on("drag", dragged)
		);

	// the label
	rangeSvg.append("text")
		.attr("class", "range-label")
		.attr("x", range_x(currentValue))
		.attr("y", rangeHeight - sliderHeight - sliderRadius - sliderPadding)
		.attr("dy", ".3em")
		.text(currentValue);

	// the pointer
	rangeSvg.append("polygon")
		.attr("class", "range-dragger range-pointer")
		.attr("points", calcPointerPoints(currentValue))
		.call(d3.drag()
			.on("drag", dragged)
		)

    d3.select("body")
			.on("keydown", function() {
				const { activeElement } = document
				if (!activeElement) return

				const isSlider = activeElement.classList.contains('range-dragger') && activeElement.classList.contains('range-handle')
				if (!isSlider) return;

				const e = d3.event
				const leftArrow = e.keyCode === 37
				const rightArrow = e.keyCode === 39

				if (!leftArrow && !rightArrow) return

				if (rightArrow) {
					currentValue++
				} else {
					currentValue--
				}

				currentValue = currentValue > extent[1] ? extent[1] :
				currentValue < extent[0] ? extent[0] : currentValue;

				onChange(currentValue)
				updateSliderPosition()
			});

	function calcPointerPoints(handle_val) {
		let point_c = range_x(handle_val) + "," + (rangeHeight - sliderHeight);
		let point_a = (range_x(handle_val) - (sliderRadius / 4)) + "," + (rangeHeight - sliderHeight - sliderPadding - (sliderRadius / 10));
		let point_b = (range_x(handle_val) + (sliderRadius / 4)) + "," + (rangeHeight - sliderHeight - sliderPadding - (sliderRadius / 10));
		return point_a + " " + point_b + " " + point_c;
	}

	function dragged() {
		let coordinates = [0, 0];
		coordinates = d3.mouse(this);
		let x = coordinates[0];
		x = x > rangeWidth ? rangeWidth :
			x < 0 ? 0 :
				x;

		// find the pct represented by the mouse position
		let pct = Math.round(range_x.invert(x));

		currentValue = pct

		onChange(currentValue)
		updateSliderPosition()
	}

	function updateSliderPosition(pos) {
		const _value = pos || currentValue
		rangeSvg.select(".range-handle")
			.attr("cx", range_x(_value));

		rangeSvg.select(".range-label")
			.attr("x", range_x(_value))
			.text(_value);

		rangeSvg.select(".range-pointer")
			.attr("points", calcPointerPoints(_value));
	}

	return updateSliderPosition
}
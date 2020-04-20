/*
*    main.js
*    Mastering Data Visualization with D3.js
*    Project 2 - Gapminder Clone
*/

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
		.range(d3.schemeAccent)

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

	const $legendsContainer = $scene.append('g')
		.attr('transform', `translate(${width / 2}, ${height + 120})`)

	$legendsContainer.selectAll('circle')
		.data(continentsData)
		.enter()
		.append('circle')
		.attr('cx', 0)
		.attr('cy', (d, i) => i * 30)
		.attr('r', 7)
		.attr('fill', d => ordinalScale(d))
		.text(d => d)
	$legendsContainer.selectAll('ordinal-legend-text')
		.data(continentsData)
		.enter()
		.append('text')
		.attr('x', 25)
		.attr('y', (d, i) => (i * 30))
		.attr("text-anchor", "left")
		.style("alignment-baseline", "middle")
		.text(d => d)

	/* Update/render visualization */
	function update(data) {
		const t = d3.transition().duration(100)
		$yearLabel.text(data.year)

		/* remove/draw/update circles/bars/whatever */

		const $circles = $vizContainer.selectAll('circle')
			.data(data.countries, d => d.country)

		$circles.exit().remove()

		const $updateSelection = $circles.enter()
			.append('circle')
			.attr('fill', d => ordinalScale(d.continent))
			.merge($circles)

		$updateSelection.transition(t)
			.attr('cx', d => xScale(d.income))
			.attr('cy', d => yScale(d.life_exp))
			.attr('r', d => sizeScale(d.population))
			.attr('opacity', 0.5)

			// update each circle's innerHTML
		$updateSelection.html(d => `
		<title>Country: ${d.country}\nGDP: ${d3.format('$')(d.income)}\nLife Expectancy: ${d.life_exp}</title>`)
	}

	/* Start the loop */
	// update(allData.slice(-1)[0])
	update(allData[0]) // initialize once instantly
	const yearToIndex = allData.reduce((map, d, idx) => {
		map[d.year] = idx
		return map
	}, {})

	/* Year Range Slider */
	const yearExtent = d3.extent(allData, d => +d.year)
	makeRangeSlider({
		extent: yearExtent,
		startValue: yearExtent[0],
		width: 800,
		element: '#range',
		onChange: value => {
			const idx = yearToIndex[value]
			update(allData[idx])
		}
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

	function updateSliderPosition() {
		rangeSvg.select(".range-handle")
			.attr("cx", range_x(currentValue));

		rangeSvg.select(".range-label")
			.attr("x", range_x(currentValue))
			.text(currentValue);

		rangeSvg.select(".range-pointer")
			.attr("points", calcPointerPoints(currentValue));
	}
}
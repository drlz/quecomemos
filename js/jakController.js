'use strinct';

jak = angular.module('jak',[] )
  .config(function($locationProvider, $routeProvider) { 
    $locationProvider.html5Mode(true); 
  });

function jakController ($scope, $http, $location) { //controller!
    //some basic interactions
  $('.js-toggleSidebar').bind('click', function(){ $(this).siblings('.js-toggle').slideToggle(400); return false; });

  $scope.startSvg = function(){
    //Define map projection
    projection = d3.geo.equirectangular()
      .translate([$scope.svg.width/2, $scope.svg.height/2])
      .scale([200]);

    //Create SVG element
    $scope.svg.mapa = {};

    $scope.svg.mapa.draw = $scope.svg.dContainer
      .append("svg")
      .attr("width", $scope.svg.width)
      .attr("height", $scope.svg.height)
      .attr("fill", 'blue');

    //Define path generator
    path = d3.geo.path().projection(projection);

    //Load in GeoJSON data
    d3.json("data/countries-hires.json", function(json) {
      //Draws the map

      $scope.svg.mapa.datos = json;

      $scope.svg.mapa.draw.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr({'d': path, 'fill': 'white', 'stroke': '#ccc', 'class': function(d){ return d.properties.ADM0_A3; } })
        .on('mouseover', function(d){
          var dElm = d3.select(this), mousePos = d3.mouse($scope.svg.container);
          dElm.style('fill', '#FDF2A8');
            //place tooltip and display
          $('#graph-note').html(d.properties.NAME).css({'left': mousePos[0],'top': mousePos[1]}).stop(true, true).fadeIn(200);
        })
        .on('mouseout', function(d){
          d3.select(this).style('fill', '#fff');
          $('#graph-note').stop(true, true).fadeOut(200);
        });
    });

  }

  $scope.updateMap = function(){
    if(!$scope.env.activeProd.imp[$scope.env.activeYear]) return;
    
    for(var feat in $scope.svg.mapa.datos.features){
      //console.log($scope.svg.mapa.datos.features[feat]);
      var countryName = $scope.svg.mapa.datos.features[feat].properties.NAME
      if($scope.env.activeProd.imp[$scope.env.activeYear] && $scope.env.activeProd.imp[$scope.env.activeYear][countryName]){
        $scope.svg.mapa.datos.features[feat]['properties'].expVal = $scope.env.activeProd.imp[$scope.env.activeYear][countryName]['value'];
        $scope.svg.mapa.datos.features[feat]['properties'].expWei = $scope.env.activeProd.imp[$scope.env.activeYear][countryName]['Netweight'];
      }
    }

    var importDataArray = getCountryArrayYear($scope.data.importsTotal[$scope.env.activeProd['name']]['imp'], $scope.env.activeYear);

      //Create scale functions
    var colorScale = d3.scale.linear()
     .domain([d3.min(importDataArray, function(d) { return parseInt(d.val); }),
        d3.max(importDataArray, function(d) { return parseInt(d.val); })])
     .range([0,1]);

    $scope.svg.mapa.draw.selectAll("path").data($scope.svg.mapa.datos.features)
      .attr({'fill': function(d){
        if($scope.data.importsTotal[$scope.env.activeProd['name']]['imp'][d.properties.NAME]) {
          var impVal = $scope.data.importsTotal[$scope.env.activeProd['name']]['imp'][d.properties.NAME][$scope.env.activeYear]['value'];
          return d3.rgb('#FAF3E5').darker(colorScale(impVal));
        };
        return 'white'; 
      }});

    //console.log($scope.svg.mapa.draw.data());
    //console.log($scope.svg.mapa.datos);
    //console.log($scope.env.activeProd.imp[$scope.env.activeYear]);
  };

    //define some initial values
  $scope.years= ['1990', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010'];
  
  $scope.svg = {};
  $scope.svg.container = document.getElementById('graph');
  $scope.svg.dContainer = d3.select("#graph");
  $scope.svg.width = 960;
  $scope.svg.height = 600;
  $scope.svg.obj = $scope.startSvg();

  $scope.env = {};
  $scope.env.activeProd = null;
  $scope.env.activeYear = null;
  $scope.env.loading = true;

    //load data
  $http.get('/data/final.json').success(function(data) {
    $scope.data = data;
    $scope.startProcess();
    //console.log($scope.data)
  }).error(function(){
    console.log('request error'); // <--------error check here 
  });

  $scope.startProcess = function(){
    $scope.env.loading = false;
    $scope.data.importsTotal = $scope.getImportsTotals();
     console.log($scope.data);
    //init
  };

  $scope.getImportsTotals = function(){
    var total = {};
      // Group by product
    for(prod in $scope.data.productos){
      if(!total[$scope.data.productos[prod].name]) total[$scope.data.productos[prod].name] = {};
      var prodData = total[$scope.data.productos[prod].name];
      prodData.imp = {};
      if($scope.data.productos[prod]) {
        for(var year in $scope.data.productos[prod].imp){
          for(var country in $scope.data.productos[prod].imp[year]){
            if(!prodData.imp[country]) prodData.imp[country] = {};
            prodData.imp[country][year] = {};
            prodData.imp[country][year] = $scope.data.productos[prod].imp[year][country];
          };
        }
      }
      prodData.exp = {};
      if($scope.data.productos[prod]) {
        for(var year in $scope.data.productos[prod].exp){
          for(var country in $scope.data.productos[prod].exp[year]){
            if(!prodData.exp[country]) prodData.exp[country] = {};
            prodData.exp[country][year] = {};
            prodData.exp[country][year] = $scope.data.productos[prod].exp[year][country];
          };
        }
      }
      // TOTAL
        // ToTAL BY PRODUCT
      for(var prod in total){
        var totalImpVal = {}, totalImpWeig = {};
        for(var country in total[prod].imp){
          for(var year in total[prod].imp[country]){
            if(!totalImpVal[year]) totalImpVal[year] = 0;
            if(!totalImpWeig[year]) totalImpWeig[year] = 0;
            totalImpVal[year] += parseFloat(total[prod].imp[country][year].value);
            totalImpWeig[year] += parseFloat(total[prod].imp[country][year].Netweight);
          }
        }
        total[prod].totalImpVal = totalImpVal;
        total[prod].totalImpWeig = totalImpWeig;
      }
      for(var prod in total){
        var totalExpVal = {}, totalExpWeig = {};
        for(var country in total[prod].exp){
          for(var year in total[prod].exp[country]){
            if(!totalExpVal[year]) totalExpVal[year] = 0;
            if(!totalExpWeig[year]) totalExpWeig[year] = 0;
            totalExpVal[year] += parseFloat(total[prod].exp[country][year].value);
            totalExpWeig[year] += parseFloat(total[prod].exp[country][year].Netweight);
          }
        }
        total[prod].totalExpVal = totalExpVal;
        total[prod].totalExpWeig = totalExpWeig;
      }
        // ToTAL BY YEAR
    }
    return total;
  }

  $scope.updateData = function(tipo, value){
    //generate graph 4 product
    if(tipo == 'prod'){
      for (var i = $scope.data.productos.length - 1; i >= 0; i--) {
        if($scope.data.productos[i].name == value) {
          $scope.env.activeProd = $scope.data.productos[i];
          //$scope.emptyActiveProds(); ##todo clean menu selections
          $scope.data.productos[i].active = true;
        }
      }
      $scope.drawProdGraph();
    }
    if (tipo == 'year'){
      $scope.env.activeYear = value;
    }

    if($scope.env.activeYear && $scope.env.activeProd) { // hay producto y año => DIBUJA
      //$scope.d3Map();
      $scope.drawImpExpGraph();
      $scope.updateMap();
    }

  };

  $scope.getCountryCoords = function(countryName){
    //generate graph 4 product
    for (var i = $scope.data.countriesCoords.length - 1; i >= 0; i--) {
      if($scope.data.countriesCoords[i].name == countryName) {
        return {'x': $scope.data.countriesCoords[i].x, 'y': $scope.data.countriesCoords[i].y };
      }
    }
    return null;
  };

  $scope.drawImpExpGraph = function(){
    if(!($scope.env.activeProd.producc || $scope.env.activeYear)) return;

    //Width and height 
    var w = 300, h = 250, padding = 50;
    if($scope.svg.ExpGraph) $scope.svg.ExpGraph.graph.selectAll('g').remove();
    $scope.svg.ExpGraph = {};
    if($scope.svg.ImpGraph) $scope.svg.ImpGraph.graph.selectAll('g').remove();
    $scope.svg.ImpGraph = {};

    var outerRadius = w / 2;
    var innerRadius = w / 3;
    var arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius);

    var pie = d3.layout.pie().value(function(d){ return d.val})
      .startAngle(-Math.PI/2).endAngle(Math.PI/2);

        //start import graph
    $scope.svg.ImpGraph.graph = d3.select("#ImpGraph svg").attr("width", w + 50).attr("height", h).append('g');

    //Set up groups
    var arcsImp = $scope.svg.ImpGraph.graph.selectAll("g.arc")
      .data(pie(getCountryArray($scope.env.activeProd.imp[$scope.env.activeYear]))).enter()
      .append("g").attr({"class": "arc", "transform": "translate(" + outerRadius + "," + outerRadius + ")"});

    //Draw arc paths
    arcsImp.append("path")
      .attr({
        'fill': function(d, i) { return d3.rgb('#FAF3E5').darker(i*0.02); },
        'stroke': '#ccc', 'd': arc, 'stroke-width': '1px'
      })
      .on('mouseover', function(d){
        var mousePos = d3.mouse(document.getElementById('ImpGraph'))
        temporal = $scope.svg.ImpGraph.graph.append('g').attr('class', 'temporary');
        temporal.append('text')
          .attr({'x': mousePos[0], 'y': mousePos[1]})
          .text(function(){ if(!$scope.isBigEnough(d.startAngle, d.endAngle)) return d.data.name; });
      })
      .on('mouseout', function(d){
        $scope.svg.ImpGraph.graph.selectAll('.temporary').remove();
      });

    //Labels
    arcsImp.append("text")
        .attr({"transform": function(d) { return "translate(" + arc.centroid(d) + ")"; }, "text-anchor": "middle" })
        .text(function(d) { if($scope.isBigEnough(d.startAngle, d.endAngle)) return d.data.name; });


    //start EXPORT graph
    $scope.svg.ExpGraph.graph = d3.select("#ExpGraph svg").attr("width", w + 50).attr("height", h).append('g');

    //Set up groups
    var arcsExp = $scope.svg.ExpGraph.graph.selectAll("g.arc")
      .data(pie(getCountryArray($scope.env.activeProd.exp[$scope.env.activeYear]))).enter()
      .append("g").attr({"class": "arc", "transform": "translate(" + outerRadius + "," + outerRadius + ")"});

    //Draw arc paths
    arcsExp.append("path")
      .attr({
        'fill': function(d, i) { return d3.rgb('#FAF3E5').darker(i*0.02); },
        'stroke': '#ccc', 'd': arc, 'stroke-width': '1px'
      })
      .on('mouseover', function(d){
        var mousePos = d3.mouse(document.getElementById('ExpGraph'))
        temporal = $scope.svg.ExpGraph.graph.append('g').attr('class', 'temporary');
        temporal.append('text')
          .attr({'x': mousePos[0], 'y': mousePos[1]})
          .text(function(){ if(!$scope.isBigEnough(d.startAngle, d.endAngle)) return d.data.name; });
      })
      .on('mouseout', function(d){
        $scope.svg.ExpGraph.graph.selectAll('.temporary').remove();
      });

    //Labels
    arcsExp.append("text")
        .attr({"transform": function(d) { return "translate(" + arc.centroid(d) + ")"; }, "text-anchor": "middle" })
        .text(function(d) { if($scope.isBigEnough(d.startAngle, d.endAngle)) return d.data.name; });
  };

  $scope.isBigEnough = function(initial, fin){
    piMedios = Math.PI / 4;
    if(Math.abs((initial + piMedios) - (fin + piMedios)) > (piMedios / 2)) return true;
    return false;
  }

  $scope.drawProdGraph = function (){
    if(!$scope.env.activeProd.producc) return;

      //Width and height
      var w = 500, h = 300, padding = 50;
      $scope.svg.prodGraph = {};

      var dataset = getYearsArray($scope.env.activeProd.producc.prod);

      //Create scale functions
      var xScale = d3.scale.linear()
       .domain([d3.min(dataset, function(d) { return d.year; }),
          d3.max(dataset, function(d) { return d.year; })
        ])
       .range([padding, w - padding * 2]);

      var yScale = d3.scale.linear()
       .domain([0, d3.max(dataset, function(d) { return d.val; })])
       .range([h - padding, padding]);

      //Create SVG element
      $scope.svg.prodGraph.prodGraph = d3.select("#prodgraph svg")
        .attr("width", w)
        .attr("height", h);

      //Create circles
      $scope.svg.prodGraph.prodGraph.selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("class", "prodDot")
        .attr("cx", function(d) { return xScale(d.year); })
        .attr("cy", function(d) { return yScale(d.val); })
        .attr("r", 5)
        .on('mouseover', function(d){
          var punto = d3.select(this).style('fill', '#FFC200'),
          temporal = $scope.svg.prodGraph.prodGraph.append('g').attr('class', 'temporary');
          temporal.append('text')
            .attr('x',parseInt(punto.attr('cx')) + 20).attr('y',punto.attr('cy'))
            .text(function(){ return 'Producción ' + d.year + ': ' + d.val; });
          temporal.append('line').attr({'x1': padding, 'x2': punto.attr('cx'), 'y1': punto.attr('cy'), 'y2': punto.attr('cy')});
          temporal.append('line').attr({'x1': punto.attr('cx'), 'x2': punto.attr('cx'), 'y1': h - padding, 'y2': punto.attr('cy')});
        })
        .on('mouseout', function(d){
          d3.select(this).style('fill', '#F5FAFF');
          $scope.svg.prodGraph.prodGraph.selectAll('.temporary').remove();
        });
      
      $scope.svg.prodGraph.prodGraph.selectAll("text").data(dataset).enter()
        .append("text")
        .text(function(d) { return d.val; })
        .attr("x", function(d) { return xScale(d.year) + 10; })
        .attr("y", function(d) { return yScale(d.val); })
        .attr("font-family", "arial,sans-serif")
        .attr("font-size", "8px")
        .attr("fill", "#ccc")
        .attr("class", "prodInfo");
        
      //Define X axis
      xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(5);

      //Define Y axis
      yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5);

      //Display axis
      $scope.svg.prodGraph.prodGraph.selectAll('.prodAxis').remove();

      $scope.svg.prodGraph.prodGraph.append("g")
        .attr("class", "prodAxis")
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d) { return "rotate(-65)"; });;

      //Create Y axis
      $scope.svg.prodGraph.prodGraph.append("g")
        .attr("class", "prodAxis")
        .attr("transform", "translate(" + padding + ",0)")
        .call(yAxis);
    };

  }

var getArray = function(object){
  var arr = [];
  for(elm in object){
    object[elm]['name'] = elm;
    arr.push(object[elm]);
  }
  return arr;
};
var getYearsArray = function(object){
  var arr = [];
  for(var elm in object){
    var obj = {};
    obj['year'] = elm;
    obj['val'] = object[elm];
    arr.push(obj);
  }
  return arr;
};

var getCountryArray = function(object){
  var arr = [];
  for(var elm in object){
    if(elm != 'World') {
      var obj = {};
      obj['name'] = elm;
      obj['val'] = object[elm].value;
      obj['peso'] = object[elm].Netweight;
      arr.push(obj);
    }
  }
  return arr;
};

var getCountryArrayYear = function(object, year){console.log(object);console.log(year)
  var arr = [], translations= { //translations isn'¡t working :p
    'France, Monaco': 'France'
  };
  for(var elm in object){ 
    if(elm != 'World') {
      var obj = {};
      if(translations[elm]) {
        obj['name'] = translations[elm];
      } else {
        obj['name'] = elm;
      }
      obj['val'] = object[elm][year].value;
      obj['peso'] = object[elm][year].Netweight;
      arr.push(obj);
    }
  }
  return arr;
};

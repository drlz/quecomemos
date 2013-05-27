'use strinct';

jak = angular.module('jak',[] )
  .config(function($locationProvider, $routeProvider) { 
    $locationProvider.html5Mode(true); 
  });

function jakController ($scope, $http, $location) { //controller!
  
  $scope.startSvg = function(){
    //Define map projection
    projection = d3.geo.mercator()
     .translate([$scope.svg.width/2, $scope.svg.height/2])
     .scale([500]);

    //Create SVG element
    var svg = d3.select("#graph")
      .append("svg")
      .attr("width", $scope.svg.width)
      .attr("height", $scope.svg.height);

    //Define path generator
    path = d3.geo.path()
             .projection(projection);

    //Load in GeoJSON data
    d3.json("data/oceans.json", function(json) {
      
      //Bind data and create one path per GeoJSON feature
      svg.selectAll("path")
         .data(json.features)
         .enter()
         .append("path")
         .attr("d", path)
         .style("fill", "steelblue");

    });

    return svg;
  }

    //define some initial values
  $scope.years= ['1990', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010'];
  
  $scope.svg = {};
  $scope.svg.width = 400;
  $scope.svg.height = 400;
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
     console.log($scope.data);
    //init
  };

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
    }
    if (tipo == 'year'){
      $scope.env.activeYear = value;
    }

    if($scope.env.activeYear && $scope.env.activeProd) { // hay producto y año => DIBUJA
      $scope.d3Map();
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

  $scope.d3Map = function(){

//console.log($scope.activeProd.imp[2010])

    $scope.svg.obj.selectAll("circle")
       .data(getArray($scope.env.activeProd.imp[$scope.env.activeYear]))
       .enter()
       .append("circle")
       .attr("cx", function(d) {
          var coords = $scope.getCountryCoords(d.name);
          if(coords && coords.x && coords.y) { 
  //          console.log(coords)
    //        console.log(projection([coords.y, coords.x]))
            return projection([coords.y, coords.x])[0]; 
          } 
          return null;
       })
       .attr("cy", function(d) {
          var coords = $scope.getCountryCoords(d.name)
          if(coords && coords.y && coords.x) { return projection([coords.y, coords.x])[1]; } 
          return null;
       })
       .attr("r", '5')
      /* .attr("r", function(d) {
          console.log(d);
          return null;        
       })*/
       .style("fill", "yellow")
       .style("opacity", 0.65)
       .on("mouseover", function(d) {console.log(d3.select(this))

          //Get this bar's x/y values, then augment for the tooltip
          var xPosition = parseFloat(d3.select(this).attr("x"));
          var yPosition = parseFloat(d3.select(this).attr("y"));

          //Create the tooltip label
          $scope.svg.obj.append("text")
             .attr("id", "tooltip")
             .attr("x", xPosition)
             .attr("y", yPosition)
             .attr("text-anchor", "middle")
             .attr("font-family", "sans-serif")
             .attr("font-size", "11px")
             .attr("font-weight", "bold")
             .attr("fill", "black")
             .text( 'hola');

       })
       .on("mouseout", function() {
         
          //Remove the tooltip
          d3.select("#tooltip").remove();
        })
  };
}

var getArray = function(object){
  var arr = [];
  for(elm in object){
    object[elm]['name'] = elm;
    arr.push(object[elm]);
  }
  return arr;
}
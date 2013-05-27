//Process all the data and generate a product list that will be exported to JSON (JSON.stringify) and used in the app

var produccion = null, tortilla = null, countryList = null, countriesCoords = null, tortillaMelons = null, productos = [],
  comodities = [
    {'code': 1509, 'name' :'ACEITE'},
    {'code': 70310, 'name' :'CEBOLLA'},
    {'code': 701, 'name' :'PATATAS'},
    {'code': 407, 'name' :'HUEVOS'},
    {'code': 080710, 'name' :'MELóN'},
    {'code': 080711, 'name' :'SANDÍA'},

    //{'code': 408, 'name' :'HUEVOS2'}
  ],
  produccYears = ['1990', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010'];
  checkData = function(){
    if(produccion && tortilla && countryList && countriesCoords && tortillaMelons){
      //todo importado -> procesemos

      //start with produccion
      processProd(produccion);

        //process tortilllla
      processImports(tortilla);
      processImports(tortillaMelons);

      //console.log(productos);

      var fin = {};
      fin.productos = productos;
      fin.countriesCoords = processCoordList(countriesCoords);
      console.log(fin);
      //document.getElementById('json').textContent = JSON.stringify(fin);
      /* PRINT COORDS CSV*/
      var CSV = '';
      for (var i = 0; i < fin.countriesCoords.length; i++){
        CSV += '"' + fin.countriesCoords[i].name + '","' + fin.countriesCoords[i].x + '","' + fin.countriesCoords[i].y + '"\n';
      }
      console.log(CSV)

    }
  },
    //get coordinates string like "20°37'E" and return decimal 
  processCoords = function(coord){
    var hour = parseInt(coord.slice(0, coord.indexOf('°'))),
      min = parseInt(coord.slice(coord.indexOf('°') + 1, coord.indexOf("'")));
    return parseFloat(((hour * 60) + min)/60).toFixed(2);
  },
    //convert the coords object to decimal values and return it
  processCoordList = function(coordList){
    for(var i=0; i<coordList.length; i++){
      coordList[i].x = processCoords(coordList[i].x);
      coordList[i].y = processCoords(coordList[i].y);
    }
    return coordList;
  }
    //process badly formed floats
  processFloats = function(float){
    var float = float.replace('.', ''),
      float = float. replace(',', '.')
    return parseFloat(float);
  },
    //test if a product exist and return it or false if new
  checkProd = function(name){
    for(var i=0; i<productos.length; i++){
      if(productos[i].name == name) return productos[i];
    }
    return null;
  },
    //return a commodity name for a commodity code
  tortillaGetName = function(comCode){
    for (var i=0; i<comodities.length; i++){
      if (comodities[i].code == comCode) return comodities[i].name;
    }
    return false;
  },
    //return a country name for a country code
  tortillaGetCountryName = function(countryCode){
    for (var i=0; i<countryList.length; i++){
      if (countryList[i]['Cty Code'] == countryCode) return countryList[i]['Cty Fullname English'];
    }
    return false;
  },
  processImports = function(importFile){
    for(var i=0; i<importFile.length; i++){
      // check the product is in our comodities list
      for (var j=0; j<comodities.length; j++){
        if(comodities[j].code == importFile[i]['Commodity Code']){
            // it's in the comoditie list -> process and add it to products
          var prod = checkProd(tortillaGetName(importFile[i]['Commodity Code'])), nuevo = false;
          if(!prod) {
            nuevo = true;
            prod = {};
            prod.imp = {};
            prod.exp = {};
            prod.name = tortillaGetName(importFile[i]['Commodity Code']);
          } else {
            if(!prod.imp) prod.imp = {};
            if(!prod.exp) prod.exp = {};
          }
            //processing!!
          if(importFile[i]['Trade Flow Code'] == 1){
            var op = 'imp';
          } else {
            var op = 'exp';
          }
          if(!prod[op][importFile[i]['Year']]) prod[op][importFile[i]['Year']] = {};
          prod[op][importFile[i]['Year']][tortillaGetCountryName(importFile[i]['Partner Code'])] = {
            'value': importFile[i]['Value'],
            'Netweight': importFile[i]['Netweight (kg)']
          };
            //append product if new
          if(nuevo) productos.push(prod);

        }
      }
    }
  },
  processProd = function(produccion){
    for(var i=0; i<produccion.length; i++){
        // check the product is in our comodities list
      for (var j=0; j<comodities.length; j++){
        if(comodities[j].name == produccion[i].Producto){
            // it's in the comoditie list -> process and add it to products
          var prod = checkProd(produccion[i].Producto), nuevo = false;
          if(!prod) {
            nuevo = true;
            prod = {};
            prod.producc = {};
            prod.producc.val = {};
            prod.producc.prod = {};
            prod.name = produccion[i].Producto;
          }
            //processing!!
          for(var k=0; k<produccYears.length; k++){
            if(produccion[i]['Producción/Valor'] == 'Valor'){
              prod.producc.val[produccYears[k]] = processFloats(produccion[i][produccYears[k]]);
            } else {
              prod.producc.prod[produccYears[k]] = processFloats(produccion[i][produccYears[k]]);
            }
          }
          if(nuevo) productos.push(prod);
        }
      }
    }
  };



  //process this files and check if everyone is ready whith checkData
d3.csv('data/ProduccionagricolaREFINE.csv',function(data){
  produccion = data;
  checkData();
});
d3.csv('data/tortilla2010.csv',function(data){
  tortilla = data;
  checkData();
});
d3.json('data/countriesCoords.json',function(data){
  countriesCoords = data;
  checkData();
});
d3.csv('data/comtradeCountryList.csv',function(data){
  countryList = data;
  checkData();
});

d3.csv('data/Melon-sandia1990-2003.csv',function(data){
  tortillaMelons = data;
  checkData();
});

/*
    // Data by product
  //console.log(series);

      // DATA by YEARS
  for(head in headers) {
    var dataYear = {};
    for (prod in series){
      //console.log( series[prod].datos[headers[head]] )
      dataYear[prod] = series[prod].datos[headers[head]];
    }
  }
  console.log(dataYear)

  var vis = d3.select("body")
    .append("svg:svg")              //create the SVG element inside the <body>
    .attr("width", w)           //set the width and height of our visualization (these will be attributes of the <svg> tag
    .attr("height", h);

  vis.selectAll("rect")
     .data(dataYear)
     .enter() 
     .append("rect")
     .attr("width", function(d, i) {console.log(d)
        return 50;
     })/*
     .attr("height", function(d, i) {
        return d.dato / 1000;
     })
     .attr("x", function(d, i) {
        return 60 * i;
     })
     .attr("y", function(d, i) {
        return 0;
     })
     .attr("fill", function(d) {
      return "rgb(0, 0, 255)";
     })

/*
  var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
        .outerRadius(r);

    var pie = d3.layout.pie()           //this will create arc data for us given a list of values
        .value(function(d) { return d.value; });    //we must tell it out to access the value of each element in our data array
        /*
  svg.selectAll("rect")
     .data(dataYear[2012])
     .enter() 
     .append("rect")
     .attr("width", function(d, i) {
        return 50;
     })
     .attr("height", function(d, i) {
        return d.dato / 1000;
     })
     .attr("x", function(d, i) {
        return 60 * i;
     })
     .attr("y", function(d, i) {
        return 0;
     })
     .attr("fill", function(d) {
      return "rgb(0, 0, 255)";
     })
/*
  var menu = d3.select("body").append('div').attr('id', 'menu2');
  menu.data(headers).enter().append('a').text(function(d){return d})
*/

  /*
var xScale = d3.scale.ordinal()
        .domain(d3.range(data.length))
        .rangeRoundBands([0, w], 0.05);

var yScale = d3.scale.linear()
        .domain([0, d3.max(data)])
        .range([0, h]);

//Create bars
svg.selectAll("rect")
   .data(data)
   .enter() 
   .append("rect")
   .attr("width", function(d, i) {
      return 50;
   })
   .attr("height", function(d, i) {
      return d.dato / 1000;
   })
   .attr("x", function(d, i) {
      return 60 * i;
   })
   .attr("y", function(d, i) {
      return 0;
   })
   .attr("fill", function(d) {
    return "rgb(0, 0, 255)";
   })
   .on("mouseover", function(d) {console.log(d.Comunidad)

    //Get this bar's x/y values, then augment for the tooltip
    var xPosition = parseFloat(d3.select(this).attr("x")) + xScale.rangeBand() / 2;
    var yPosition = parseFloat(d3.select(this).attr("y")) / 2 + h / 2;

    //Update the tooltip position and value
    d3.select("#tooltip")
      .style("left", xPosition + "px")
      .style("top", yPosition + "px")           
      .select("#value")
      .text(d.Comunidad + ' ' + d.dato + ' explotaciones');
   
    //Show the tooltip
    d3.select("#tooltip").classed("hidden", false);

   })
   .on("mouseout", function() {
   
    //Hide the tooltip
    d3.select("#tooltip").classed("hidden", true);
    
   })
   .on("click", function() {
      sortBars();
   });
*/
/*
})
//Width and height
var w = 600;
var h = 250;
/*
var dataset = [ 5, 10, 13, 19, 21, 25, 22, 18, 15, 13,
        11, 12, 15, 20, 18, 17, 16, 18, 23, 25 ];

var xScale = d3.scale.ordinal()
        .domain(d3.range(dataset.length))
        .rangeRoundBands([0, w], 0.05);

var yScale = d3.scale.linear()
        .domain([0, d3.max(dataset)])
        .range([0, h]);
*/
//Create SVG element
/*
var svg = d3.select("body")
      .append("svg")
      .attr("width", w)
      .attr("height", h);

/*Create bars
svg.selectAll("rect")
   .data(dataset)
   .enter()
   .append("rect")
   .attr("x", function(d, i) {
      return xScale(i);
   })
   .attr("y", function(d) {
      return h - yScale(d);
   })
   .attr("width", xScale.rangeBand())
   .attr("height", function(d) {
      return yScale(d);
   })
   .attr("fill", function(d) {
    return "rgb(0, 0, " + (d * 10) + ")";
   })
   .on("mouseover", function(d) {

    //Get this bar's x/y values, then augment for the tooltip
    var xPosition = parseFloat(d3.select(this).attr("x")) + xScale.rangeBand() / 2;
    var yPosition = parseFloat(d3.select(this).attr("y")) / 2 + h / 2;

    //Update the tooltip position and value
    d3.select("#tooltip")
      .style("left", xPosition + "px")
      .style("top", yPosition + "px")           
      .select("#value")
      .text(d);
   
    //Show the tooltip
    d3.select("#tooltip").classed("hidden", false);

   })
   .on("mouseout", function() {
   
    //Hide the tooltip
    d3.select("#tooltip").classed("hidden", true);
    
   })
   .on("click", function() {
      sortBars();
   });

//Define sort order flag
var sortOrder = false;

//Define sort function
var sortBars = function() {

  //Flip value of sortOrder
    sortOrder = !sortOrder;

  svg.selectAll("rect")
     .sort(function(a, b) {
        if (sortOrder) {
          return d3.ascending(a, b);
        } else {
          return d3.descending(a, b);
        }
      })
     .transition()
     .delay(function(d, i) {
       return i * 50;
     })
     .duration(1000)
     .attr("x", function(d, i) {
        return xScale(i);
     });

};      */

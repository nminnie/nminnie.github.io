var map;
var toiletMarker;
var path = "https://raw.githubusercontent.com/nminnie/Open-data/master/";
var fileName = [path + "electronics.csv", path + "food-scrap.csv", path + "recycle-bins.csv", path + "trash-bins.csv", path + "restrooms.csv"];
var publicWashroom = new Array(); //array of info from csv
var electronics = new Array();
var foodScrap = new Array();
var recycle = new Array();
var trash = new Array();
var index = 0;
var minLat = 40.4, maxLat = 41.0, numCol = 40, numRow = 50, minLong = -74.2, maxLong = -73.7;
var latInterval = (maxLat - minLat) / numCol;
var longInterval = (maxLong - minLong) / numRow;
var directionsService;
var directionsDisplay;
var userPosition;
var routeDuration;
var totalFeatures = new Array();

var foodFeatures = new Array();
var electronicsFeatures = new Array();
var recycleFeatures = new Array();
var restroomFeatures = new Array();
var binFeatures = new Array();

var latitude = randomBetween(40.596840, 40.868670);
var longitude = randomBetween(-73.997854, -73.898827);


//Numbers entire region into groups & Initialize
var temp = new Array(numCol*numRow);
var tempGroups = new Array(numCol*numRow);
var washroomGroups = new Array(numCol * numRow);  //2D arrays
var electronicsGroups = new Array(numCol * numRow);  //2D arrays
var foodScrapGroups = new Array(numCol * numRow);  //2D arrays
var recycleGroups = new Array(numCol * numRow);  //2D arrays
var trashGroups = new Array(numCol * numRow);  //2D arrays
for (var i = 0; i < numCol * numRow; i++) {
  tempGroups[i] = new Array();
  washroomGroups[i] = new Array();  //have a numRow*numCol array of arrays that stores the indices of adjacent points

}

var parsed;
function parseAllData(){
for (var itrt = 0; itrt < fileName.length; itrt++) {
  let itr = itrt;

  setTimeout(function(){
    Papa.parse(fileName[itr], {
      download: true,
      complete: function (results) {
        temp = results.data;
        var tempGroups = new Array(numCol*numRow);
        index = 0;

        for (var i = 0; i < numCol * numRow; i++) {
          tempGroups[i] = new Array();
        }
        for (var i = 1; i < temp.length - 1; i++) {

          var col = Math.floor((temp[i][0] - minLat) / latInterval);
          var row = Math.floor((temp[i][1] - minLong) / longInterval);
          var tmp = (temp[i][0] - minLat) / latInterval;
          if (row < 0) row = 0;
          temp[i][4] = row;
          temp[i][5] = col;
          temp[i][6] = i-1;

          var groupNum = row * numCol + col;
          if (groupNum > numRow*numCol)
            groupNum = numRow*numCol-1;
          if (tempGroups[groupNum].length == null) {
            tempGroups[groupNum][0] = i-1;
          }
          else {
            tempGroups[groupNum].push(i-1);
          }
        }


        if (itr == 0){
          electronicsGroups = tempGroups;
          electronics = temp;
        }
        else if (itr == 1){
          foodScrapGroups = tempGroups;
          foodScrap = temp;
        }
        else if (itr == 2){
          recycleGroups = tempGroups;
          recycle = temp;
        }
        else if (itr==4){
          washroomGroups = tempGroups;
          publicWashroom = temp;
        }
        else if (itr==3){
          trashGroups = tempGroups;
          trash = temp;
        }
      }

    });

}, 2000);}
}

function mapLocToNearest(publicWashroom, washroomGroups, currLong, currLat) {

  //returns the nearest washrooms
  [row, col] = calcRowCol(currLong, currLat);
  if (row < 0) row = 0;
  nearestWashrooms = new Array(); //1d array
  radius = 0;
  var visited = new Array(numRow);
  for (var i = 0; i < numCol; i++)
    visited[i] = new Array(false);
  while (nearestWashrooms.length < 3 && radius < 3) { //while you have less than 10 washrooms in the list
    for (var i = row - radius; i <= row + radius; i++) { //iterate through larger and larger squares
      if (i >= 0 && i < numRow) {  //if in the right range
        for (var j = col - radius; j <= col + radius; j++) {
          if (j >= 0 && j <= numCol) {

            if (!visited[i][j]) {
              var group = i * numCol + j;
              if (group > numCol*numRow) group = numCol*numRow-1;
              for (var k = 0; k < washroomGroups[group].length; k++) {//iterate through all points in that group
                var n = washroomGroups[group][k];
                var len = (publicWashroom[n].length);

                nearestWashrooms.push(publicWashroom[washroomGroups[group][k]][len-1]);
              }
              visited[i][j] = true;
            }

          }
          else {
            break;
          }
        }
      }
    }
    radius++;
  }

    return nearestWashrooms.slice(0, 16);
}

function calcRowCol(long, lat) {
  var col = Math.ceil((long - minLat) / latInterval);
  var row = Math.ceil((lat - minLong) / longInterval);
  return [row, col];
}


function initMap() {
  directionsService = new google.maps.DirectionsService;
  directionsDisplay = new google.maps.DirectionsRenderer({
      polylineOptions: {
          strokeColor: "white"
      }
  });
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 40.732254, lng: -73.996033 },
    zoom: 10,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#0b6189' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }]
      },
      {
        featureType: 'poi',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#263c3f' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6b9a76' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#38414e' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#212a37' }]
      },
      {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: 'white' }]
      },
      {
        featureType: 'road.highway',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#2f3948' }]
      },
      {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#515c6d' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#17263c' }]
      }
    ]
  });
  directionsDisplay.setMap(map);
  parseAllData();
  setTimeout(function(){  //Strings: long, lat, name, bin, recycle, electronics, food, restroom, accessibility
   var nearbyWashroom = mapLocToNearest(this.publicWashroom, washroomGroups, latitude, longitude);
   var nearbyElectronics = mapLocToNearest(this.electronics,this.electronicsGroups, latitude, longitude);
   var nearbyfood = mapLocToNearest(this.foodScrap,this.foodScrapGroups, latitude, longitude);
   var nearbyRecycle = mapLocToNearest(this.recycle,this.recycleGroups, latitude, longitude);
   var nearbyTrash = mapLocToNearest(this.trash,this.trashGroups, latitude, longitude);

   for (var i = 0; i < nearbyTrash.length; i+=2){
    var newobject = {
      position: new google.maps.LatLng(parseFloat(trash[nearbyTrash[i]][0]), parseFloat(trash[nearbyTrash[i]][1])),
      name: trash[nearbyTrash[i]][2],
      type: 'bin',
    };
    binFeatures.push(newobject);
   }
   for (var i = 0; i < nearbyElectronics.length; i++){
    var newobject = {
      position: new google.maps.LatLng(parseFloat(electronics[nearbyElectronics[i]][0]), parseFloat(electronics[nearbyElectronics[i]][1])),
      name: electronics[nearbyElectronics[i]][2],
      type: 'electronics'
    };
    electronicsFeatures.push(newobject);
   }
   for (var i = 0; i < nearbyRecycle.length; i++){
    var newobject = {
      position: new google.maps.LatLng(parseFloat(recycle[nearbyRecycle[i]][0]), parseFloat(recycle[nearbyRecycle[i]][1])),
      name: recycle[nearbyRecycle[i]][2],
      type: 'recycle'
    };
    recycleFeatures.push(newobject);
   }
   for (var i = 0; i < nearbyfood.length; i++){
    var newobject = {
      position: new google.maps.LatLng(parseFloat(foodScrap[nearbyfood[i]][0]), parseFloat(foodScrap[nearbyfood[i]][1])),
      name: foodScrap[nearbyfood[i]][2], type: 'food'
    };
    foodFeatures.push(newobject);
   }
   for (var i = 0; i < nearbyWashroom.length; i++){
    var newobject = {
      position: new google.maps.LatLng(parseFloat(publicWashroom[nearbyWashroom[i]][0]), parseFloat(publicWashroom[nearbyWashroom[i]][1])),
      name: publicWashroom[nearbyWashroom[i]][2],
      type: 'restroom',
      accessibility: publicWashroom[nearbyWashroom[i]][3]
    };
    restroomFeatures.push(newobject);
   }

 }, 4000);

}
var checkedBoxes = document.getElementsByTagName("input");
var binMarkers = [],
    recycleMarkers = [],
    foodMarkers = [],
    electronicsMarkers = [],
    restroomMarkers = [];
function showBin() {
  var icon = "icons/bin.svg";
  var isChecked = checkedBoxes[0].checked;
  if (isChecked) {
    binFeatures.forEach(function (feature) {
      var marker = new google.maps.Marker({
        position: feature.position,
        icon: icon,
        map: map,
        info: feature.name,
        clicked: false
      });
      addListeners(marker);
      binMarkers.push(marker);
    });
  }
  else {
    binMarkers.forEach(function (marker) {
      marker.setMap(null);
    });
  }
}

function showRecycle() {
  var icon = "icons/recycle.svg";
  var isChecked = checkedBoxes[1].checked;
  if (isChecked) {
    recycleFeatures.forEach(function (feature) {
      var marker = new google.maps.Marker({
        position: feature.position,
        icon: icon,
        map: map,
        info: feature.name,
        clicked: false
      });
      addListeners(marker);
      recycleMarkers.push(marker);
    });
  }
  else {
    recycleMarkers.forEach(function (marker) {
      marker.setMap(null);
    });
  }
}

function showFood() {
  var icon = "icons/food.svg";
  var isChecked = checkedBoxes[2].checked;
  if (isChecked) {
    foodFeatures.forEach(function (feature) {
      var marker = new google.maps.Marker({
        position: feature.position,
        icon: icon,
        map: map,
        info: feature.name,
        clicked: false
      });
      addListeners(marker);
      foodMarkers.push(marker);
    });
  }
  else {
    foodMarkers.forEach(function (marker) {
      marker.setMap(null);
    });
  }
}

function showElectronics() {
  var icon = "icons/phone.svg";
  var isChecked = checkedBoxes[3].checked;
  if (isChecked) {
    electronicsFeatures.forEach(function (feature) {
      var marker = new google.maps.Marker({
        position: feature.position,
        icon: icon,
        map: map,
        info: feature.name,
        clicked: false
      });
      addListeners(marker);
      electronicsMarkers.push(marker);
    });
  }
  else {
    electronicsMarkers.forEach(function (marker) {
      marker.setMap(null);
    });
  }
}

function showRestroom() {
  var icon = "icons/restroom.svg";
  var isChecked = checkedBoxes[4].checked;
  if (isChecked) {
    restroomFeatures.forEach(function (feature) {
      var marker = new google.maps.Marker({
        position: feature.position,
        icon: icon,
        map: map,
        info: feature.name + "<br>" + "Wheelchair accessible:" + feature.accessibility,
        clicked: false
      });
      addListeners(marker);
      restroomMarkers.push(marker);
    });
  }
  else {
    restroomMarkers.forEach(function (marker) {
      marker.setMap(null);
    });
  }
}

function addListeners(marker){
    marker.addListener('click', function() {
        marker.clicked = true;
        calculateAndDisplayRoute(marker, directionsService, directionsDisplay);
    });

    marker.addListener('mouseover', function() {
        if (!marker.clicked) {
            var infowindow = new google.maps.InfoWindow( {
                content: marker.info
            });
            infowindow.open(map, marker);
            marker.addListener('mouseout', function() {
                infowindow.close(map, marker);
            });
        }

    });
}


function hoverOn() {
  document.getElementById("gps").firstChild.setAttribute("fill", "#0C6189");
  document.getElementsByTagName("body")[0].style.cursor = "pointer";
}

function hoverOff() {
  document.getElementById("gps").firstChild.setAttribute("fill", "#17263C");
  document.getElementsByTagName("body")[0].style.cursor = "auto";
}

function loadControls() {
  var div = document.getElementById("localization");
  div.parentNode.removeChild(div);
  document.getElementById("controlPanel").style.visibility = "visible";

  var pos = {lat: latitude, lng: longitude};

  userPosition = new google.maps.Marker({
      position: pos,
      map: map
  });

  map.setCenter(pos);
  map.setZoom(13);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function calculateAndDisplayRoute(marker, directionsService, directionsDisplay) {
    directionsService.route({
        origin: userPosition.position,
        destination: marker.position,
        travelMode: 'WALKING'
    }, function (response, status) {
        if (status === 'OK') {
            directionsDisplay.setDirections(response);
            directionsDisplay.setOptions({suppressMarkers: true});
            routeDuration = response.routes[0].legs[0].duration.text;

            var infowindow = new google.maps.InfoWindow({
                content: marker.info + "<br>" + "Travel time: " + routeDuration
            });

            infowindow.open(map, marker);

            google.maps.event.addListener(infowindow,'closeclick',function(){
                marker.clicked = false;
            });

        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

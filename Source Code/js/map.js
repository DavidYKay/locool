var user_html5_latlng;
var user_zip_code_latlng;
var favorites_map;
var favorite_markers = new Object();
var open_info_window;

function renderPlacesMap() {
	getUserLocation(false, function(user_latlng, ip_geolocation) {
	    var map_icons = {};
	    map_icons.venue = "images/venue.png";
		renderMap(user_latlng, 
			ip_geolocation, 
			function(myOptions) {
				if (favorites_map == null) {
					favorites_map = new google.maps.Map(document.getElementById("the-map"), myOptions);
				}
				return favorites_map;
			}, 
			function(the_map, drawMapMarkers) {
				google.maps.event.addListenerOnce(the_map, 'tilesloaded', function() {
                    var request_data = {
                        'lat': user_latlng.lat(),
                        'lng': user_latlng.lng()
                    };
                	$.getJSON('venues', request_data, function(data) {
                            drawMapMarkers(data.venues);
                    });
				});
			}, 
			map_icons, 
			favorite_markers
		);
	});
}

function getUserLocation(has_favorites, callback) {
	var ret_val;
	if (user_html5_latlng != null) {
    	var ret_val = new Object();
    	ret_val['user_latlng'] = user_html5_latlng;
    	ret_val['ip_geolocation'] = false;
		if (console != null) {console.log("The user's location is %f, %f.", user_html5_latlng.lat(), user_html5_latlng.lng());}
		callback(ret_val.user_latlng, ret_val.ip_geolocation);
	}
	else {
    	if(navigator.geolocation) {
    		navigator.geolocation.getCurrentPosition(function(position) {
    			var pos_latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    			user_html5_latlng = pos_latlng;
    			ret_val = addIpGeolocation(pos_latlng, has_favorites);
    			callback(ret_val.user_latlng, ret_val.ip_geolocation);
    		}, function() {
    			ret_val = addIpGeolocation(null, has_favorites);
    			callback(ret_val.user_latlng, ret_val.ip_geolocation);
    		});
    	}
    	else {
    		ret_val = addIpGeolocation(null, has_favorites);
    		callback(ret_val.user_latlng, ret_val.ip_geolocation);
    	}
	}
}

function addIpGeolocation(user_latlng, has_favorites) {
	var ip_geolocation;
	if (user_latlng == null) {
		if (console != null) {console.log("The user's location is unknown.");}
		if (!has_favorites) {
			//TODO: IP geolocation. If it fails, use null.
			ip_geolocation = false;
		}
	}
	else {
		if (console != null) {console.log("The user's location is %f, %f.", user_latlng.lat(), user_latlng.lng());}
		ip_geolocation = false;
	}
	
	var ret_val = new Object();
	ret_val['user_latlng'] = user_latlng;
	ret_val['ip_geolocation'] = ip_geolocation;
	return ret_val;
}

function hasFavorites(data) {
	var has_favorites = false;
	if (data != null) {
		$.each(data, function(i, item) {
			has_favorites = true;
		});
	}
	return has_favorites;
}

function renderMap(user_latlng, ip_geolocation, createMap, drawMapMarkers, marker_icons, marker_list) {
	var center;
	if (user_latlng == null) {
		center = new google.maps.LatLng(40.73, -73.99);
	}
	else {
		center = user_latlng;
	}
	
	var myOptions = {
		zoom: 12,
		center: center,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
		
	var the_map = createMap(myOptions);
	drawMapMarkers(the_map, function(data) {
		var min_max_lat_lng = getNewMinMaxLatLng();
		var has_favorites = false;

		$.each(data, function(i, item) {
			has_favorites = true;
			item_lat = parseFloat(item.lat);
			item_lng = parseFloat(item.lng);
			var my_latlng = new google.maps.LatLng(item_lat, item_lng);
			var poiMarker = new google.maps.Marker({
				position: my_latlng,
				map: the_map,
				title: item.listing_name + ': ' + item.offer_title,
				icon: marker_icons['venue']
			});

            google.maps.event.addListener(poiMarker, 'click', function() {
                
                if (item.offer_description) {
                    var deal_description = item.offer_description;
                }
                else {
                    var deal_description = item.offer_title;
                }
                if (item.image_url) {
                    var venue_pic = item.image_url;
                }
                else {
                    var venue_pic = 'images/venue_placeholder.png';
                }

                var venue_id = item.venue_id;
                var name = item.name;
                var address_1 = item.address1;
                var address_2 = item.address2;
                if (address_2 == null) {
                    address_2 = '';
                }
                var address_3 = item.address3;
                var venue_lat = item.latitude;
                var venue_lng = item.longitude;
                
                $("#info-window-html-template #map-info-window #title").html(name);
                $("#info-window-html-template #map-info-window #address1").html(address_1);
                $("#info-window-html-template #map-info-window #address2").html(address_2);
                $("#info-window-html-template #map-info-window #address3").html(address_3);
                $("#info-window-html-template #map-info-window #image").html('<img src="' + venue_pic + '"/>');
                var content_html = $("#info-window-html-template").html();
                info_window = new google.maps.InfoWindow({
                    content: content_html
                });
                if (open_info_window != null) {
                    open_info_window.close();
                }
                open_info_window = info_window;
                google.maps.event.addListenerOnce(info_window, 'domready', function() {
                    $("#map-info-window #title").html(name);
                    $("#map-info-window #address1").html(address_1);
                    $("#map-info-window #address2").html(address_2);
                    $("#map-info-window #address3").html(address_3);
                    $("#map-info-window #image").html('<img src="' + venue_pic + '"/>');
                    $("#map-info-window #add-to-favorites").click(function() {
                        alert('Some other time');
/*
                    	var postData = {};
                    	var jsonObject = {};
                    	jsonObject["action"] = 'save_favorite';
                    	jsonObject["venue_id"] = venue_id;
                    	jsonObject["name"] = name;
                    	jsonObject["address_1"] = address_1;
                    	jsonObject["address_2"] = address_2;
                    	jsonObject["address_3"] = address_3;
                    	jsonObject["lat"] = venue_lat;
                    	jsonObject["lng"] = venue_lng;
                    	postData["post_data"] = JSON.stringify(jsonObject);
                    	$.ajax({
                    		type : 'POST',
                    		url : 'favorites',
                    		dataType : 'json',
                    		data : postData,
                    		success : function(msg) {
                    		},
                    		error: function() {
                    		}
                    	});
*/
                    });
                });
                info_window.open(the_map, poiMarker);
                
            });
			marker_list[item.venue_id] = poiMarker;
			min_max_lat_lng = adjustMinMax(min_max_lat_lng, item_lat, item_lng);
		});

		if (has_favorites) {
			if (user_latlng != null) {
				min_max_lat_lng = adjustMinMax(min_max_lat_lng, user_latlng.lat(), user_latlng.lng());
				poiMarker = new google.maps.Marker({
					position: user_latlng,
					map: the_map,
					title: 'Your location',
					icon: 'images/your_location.png'
				});
			}
			var sw = new google.maps.LatLng(min_max_lat_lng.min_lat, min_max_lat_lng.min_lng);
			var ne = new google.maps.LatLng(min_max_lat_lng.max_lat, min_max_lat_lng.max_lng);
			bounds = new google.maps.LatLngBounds(sw, ne);
			the_map.fitBounds(bounds);
		}
		else {
			if (user_latlng != null && !ip_geolocation) {
				poiMarker = new google.maps.Marker({
					position: user_latlng,
					map: the_map,
					title: 'Your location',
					icon: 'images/your_location.png'
				});
			}
			the_map.setCenter(new google.maps.LatLng(center.lat(), center.lng()));
			the_map.setZoom(12);
		}
	});
}

function getNewMinMaxLatLng() {
	var ret_val = new Object();
	ret_val.min_lat = 90.1;
	ret_val.min_lng = 180.1;
	ret_val.max_lat = -90.1;
	ret_val.max_lng = -180.1;
	ret_val.is_valid = false;
	return ret_val;
}

function findMinMaxLatLng(data, getLat, getLng) {
	var ret_val = getNewMinMaxLatLng();
	$.each(data, function(i, item) {
		ret_val = adjustMinMax(ret_val, getLat(item), getLng(item));
	});
	return ret_val;
}

function adjustMinMax(min_max_lat_lng, additional_lat, additional_lng) {
	if (additional_lat < min_max_lat_lng.min_lat) {
		min_max_lat_lng.is_valid = true;
		min_max_lat_lng.min_lat = additional_lat;
	}
	if (additional_lng < min_max_lat_lng.min_lng) {
		min_max_lat_lng.is_valid = true;
		min_max_lat_lng.min_lng = additional_lng;
	}
	if (additional_lat > min_max_lat_lng.max_lat) {
		min_max_lat_lng.is_valid = true;
		min_max_lat_lng.max_lat = additional_lat;
	}
	if (additional_lng > min_max_lat_lng.max_lng) {
		min_max_lat_lng.is_valid = true;
		min_max_lat_lng.max_lng = additional_lng;
	}
	return min_max_lat_lng;
}

$(document).ready(function(){
    $("#the-map").html('<div>Loading...</div>');
	$("#the-map").corner('4px');
    $("#the-map").height('500px');
    renderPlacesMap();
});

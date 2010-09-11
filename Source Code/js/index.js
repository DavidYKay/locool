var user_html5_latlng;
var user_zip_code_latlng;
var default_search_tip = "name, address, or zip";
var favorites_map;
var search_map;
var template_html_favs_addr = "";
var favorite_pos = -1;
var contact_level_default = 'medium';
var action = '';
var contact_level_mapping = {'low': 'L', 'medium': 'M', 'high': 'H'};
var favorite_markers = new Object();
var search_markers = new Object();
var enlarged = false;
var open_info_window;

function renderDealsMap() {
    if (console != null) {console.log("renderFavoritesTable()");}
    
	getUserLocation(false, function(user_latlng, ip_geolocation) {
	    var map_icons = {};
	    map_icons.deal = "images/deal.png";
		renderMap(user_latlng, 
			ip_geolocation, 
			function(myOptions) {
				if (favorites_map == null) {
					favorites_map = new google.maps.Map(document.getElementById("main-row"), myOptions);
				}
				return favorites_map;
			}, 
			function(the_map, drawMapMarkers) {
				google.maps.event.addListenerOnce(the_map, 'tilesloaded', function() {
                    var request_data = {
                        'lat': user_latlng.lat(),
                        'lon': user_latlng.lng(),
                        'rpp': 25,
                        'radius': 1,
                        'sort': 'dist'
                    };
                	$.getJSON('deals', request_data, function(data) {
                            drawMapMarkers(data.offer);
                    });
				});
			}, 
			map_icons, 
			favorite_markers
		);
	});
}

function getUserLocation(has_favorites, callback) {
	if (console != null) {console.log("getUserLocation()");}

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
	if (console != null) {console.log("addIpGeolocation()");}
	
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
    if (console != null) {console.log("hasFavorites()");}
    
	var has_favorites = false;
	if (data != null) {
		$.each(data, function(i, item) {
			has_favorites = true;
		});
	}
	return has_favorites;
}

function renderMap(user_latlng, ip_geolocation, createMap, drawMapMarkers, marker_icons, marker_list) {
    if (console != null) {console.log("renderMap()");}
    
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
			item_lat = parseFloat(item.latitude);
			item_lng = parseFloat(item.longitude);
			var my_latlng = new google.maps.LatLng(item_lat, item_lng);
			var poiMarker = new google.maps.Marker({
				position: my_latlng,
				map: the_map,
				title: item.listing_name + ': ' + item.offer_title,
				icon: marker_icons['deal']
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

                var venue_id = item.listing_id;
                var name = item.listing_name;
                var category = 'shopping';
                var address_1 = item.street;
                var address_2 = item.city + ', ' + item.state;
                var venue_lat = item.latitude;
                var venue_lng = item.longitude;
                var contact_level = 'medium';
                
                $("#info-window-html-template #map-info-window #title").html(item.listing_name);
                $("#info-window-html-template #map-info-window #details").html(deal_description);
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
                    $("#map-info-window #title").html(item.listing_name);
                    $("#map-info-window #details").html(deal_description);
                    $("#map-info-window #image").html('<img src="' + venue_pic + '"/>');
                    $("#map-info-window #add-to-favorites").click(function() {
                    	var postData = {};
                    	var jsonObject = {};
                    	jsonObject["action"] = 'insert_into_new_spot';
                    	jsonObject["venue_id"] = venue_id;
                    	jsonObject["name"] = name;
                    	jsonObject["category"] = category;
                    	jsonObject["address_1"] = address_1;
                    	jsonObject["address_2"] = address_2;
                    	jsonObject["lat"] = venue_lat;
                    	jsonObject["lng"] = venue_lng;
                    	jsonObject["contact_level"] = contact_level;
                    	postData["post_data"] = JSON.stringify(jsonObject);
                    	$.ajax({
                    		type : 'POST',
                    		url : 'venue_update',
                    		dataType : 'json',
                    		data : postData,
                    		success : function(msg) {
                    		    window.location = 'my_account?tab=favorites&added_venue_id=' + venue_id;
                    		},
                    		error: function() {
                    		    alert("Sorry, couldn't add it to your favorites. You don't have any free spots.");
                    		}
                    	});
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

function createSearchMap(user_latlng, callback) {
    if (console != null) {console.log("createSearchMap()");}

    var myOptions = {
		zoom: 12,
		center: new google.maps.LatLng(user_latlng.lat(), user_latlng.lng()),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	search_map = new google.maps.Map(document.getElementById("search-map"), myOptions);
	google.maps.event.addListenerOnce(search_map, 'tilesloaded', function() {
	    callback();
	});
}

function lookupZipCode() {
    if (console != null) {console.log("lookupZipCode()");}
    
    var zip_code = $("#zip-code-lookup-box").val();
    if (console != null) {console.log("looking up: %s", zip_code);}
    new google.maps.Geocoder().geocode({'address': zip_code}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
			$("#search-panel-container").show();
			$("#no-location-panel-container").hide();
            user_zip_code_latlng = results[0].geometry.location;
            createSearchMap(user_zip_code_latlng, function() {
                findPlaceSimple(user_zip_code_latlng);
            });
        }
        else {
            alert("Could not determine your zip code's coordinates for the following reason: " + status);
        }
    });
	return false;
}

function onMapClick() {
	$("#deals-map").unbind('click.map-expander');
	enlarged = true;
    $("#main-row").height('500px');
    $("#main-row").children().each(function(index) {
        $(this).hide();
    });
    $("#main-row").html('<div>Loading...</div>');
    renderDealsMap();
};

$(document).ready(function(){
	$("#deals-map").corner("4px");
	$("#show-map-button").corner("10px");

	$("#deals-map").bind('click.map-expander', onMapClick);
});


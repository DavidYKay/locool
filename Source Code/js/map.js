var user_html5_latlng;
var user_zip_code_latlng;
var venues_map;
var venue_markers = new Object();

function renderPlaces() {
	getUserLocation(false, function(user_latlng, ip_geolocation) {
	    var map_icons = {};
	    map_icons.venue = 'images/venue.png';
		renderMap(user_latlng, 
			ip_geolocation, 
			function(myOptions) {
				if (venues_map == null) {
					venues_map = new google.maps.Map(document.getElementById("the-map"), myOptions);
				}
				return venues_map;
			}, 
			function(the_map, drawMapMarkers) {
				google.maps.event.addListenerOnce(the_map, 'tilesloaded', function() {
                    var request_data = {
                        'lat': user_latlng.lat(),
                        'lng': user_latlng.lng()
                    };
                	$.getJSON('venues', request_data, function(data) {
                            drawMapMarkers(data.venues, user_latlng, venues_map, false, map_icons, venue_markers);
                    });
				});
			}, 
			map_icons, 
			venue_markers
		);
	});
}

function getUserLocation(has_venues, callback) {
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
    			ret_val = addIpGeolocation(pos_latlng, has_venues);
    			callback(ret_val.user_latlng, ret_val.ip_geolocation);
    		}, function() {
    			ret_val = addIpGeolocation(null, has_venues);
    			callback(ret_val.user_latlng, ret_val.ip_geolocation);
    		});
    	}
    	else {
    		ret_val = addIpGeolocation(null, has_venues);
    		callback(ret_val.user_latlng, ret_val.ip_geolocation);
    	}
	}
}

function addIpGeolocation(user_latlng, has_venues) {
	var ip_geolocation;
	if (user_latlng == null) {
		if (console != null) {console.log("The user's location is unknown.");}
		if (!has_venues) {
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

function hasVenues(data) {
	var has_venues = false;
	if (data != null) {
		$.each(data, function(i, item) {
			has_venues = true;
		});
	}
	return has_venues;
}

function cleanUp() {
    $.each(venue_markers, function(data) {
        venue_markers[data].setMap(null);
    });
	
	var row = "#venues-table tbody tr:last";

    var template_row_html = '<tr class="last" style="display: none;">' + $(row).html() + '</tr>';
    $("#venues-table tbody").html('');
    $("#venues-table tbody").append(template_row_html);
    
}

function drawPOI(data, user_latlng, the_map, ip_geolocation, marker_icons, marker_list) {
    cleanUp();

	var min_max_lat_lng = getNewMinMaxLatLng();
	var has_venues = false;

	$.each(data, function(i, item) {
		has_venues = true;
		
		renderListItem(item);
		
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
            
            $("#venue-details-container #title").html(name);
            $("#venue-details-container #address1").html(address_1);
            $("#venue-details-container #address2").html(address_2);
            $("#venue-details-container #address3").html(address_3);
            $("#venue-details-container #image").html('<img src="' + venue_pic + '"/>');
            var content_html = $("#info-window-html-template").html();

            showPopUp(venue_id, name, address_1, address_2, address_3, venue_lat, venue_lng, venue_pic);
            
        });
		marker_list[item.venue_id] = poiMarker;
		min_max_lat_lng = adjustMinMax(min_max_lat_lng, item_lat, item_lng);
	});

	if (has_venues) {
		if (user_latlng != null) {
		    // the next line should be called only if the user is near the other listings, so it's commented out for now
            // min_max_lat_lng = adjustMinMax(min_max_lat_lng, user_latlng.lat(), user_latlng.lng());
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
	drawMapMarkers(the_map, drawPOI);
}

function renderListItem(item) {
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
    if (item.image_url) {
        var venue_pic = item.image_url;
    }
    else {
        var venue_pic = 'images/venue_placeholder.png';
    }
    
	var row = "#venues-table tbody tr:last";

    $(row).removeClass('last');
    var template_row_html = '<tr class="last">' + $(row).html() + '</tr>';
    $("#venues-table tbody").append(template_row_html);
    
    $(row + " #venue-name").html(name);
    $(row + " #address_1").html(address_1);
    $(row + " #address_2").html(address_2);
    $(row + " #address_3").html(address_3);
    
    $(row).hover(
        function() {
            venue_markers[venue_id].setIcon('images/venue_hover.png');
        }, 
        function() {
            venue_markers[venue_id].setIcon('images/venue.png');
        }
    );

    $(row).click(function() {
        showPopUp(venue_id, name, address_1, address_2, address_3, venue_lat, venue_lng, venue_pic);
    });
}

function showPopUp(venue_id, name, address_1, address_2, address_3, venue_lat, venue_lng, venue_pic) {
                	$.colorbox({width: "600px", 
                				opacity: 0.6, 
                				transition: "elastic", 
                				speed: 200, 
                				inline: true, 
                				href: '#venue-details-container',
                				onComplete: function() {
                					$("#cboxContent").corner("10px");
                					$("#cboxLoadedContent").corner("6px");
                                    $("#venue-details-container #title").html(name);
                                    $("#venue-details-container #address1").html(address_1);
                                    $("#venue-details-container #address2").html(address_2);
                                    $("#venue-details-container #address3").html(address_3);
                                    $("#venue-details-container #image").html('<img src="' + venue_pic + '"/>');
                                    $("#venue-details-container #add-to-favorites").unbind('click.add-venue');
                                	$("#venue-details-container #add-to-favorites").bind('click.add-venue', function() {
                                        alert('Some other time');
    /*
                                    	var postData = {};
                                    	var jsonObject = {};
                                    	jsonObject["action"] = 'save_venue';
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
                                    		url : 'venues',
                                    		dataType : 'json',
                                    		data : postData,
                                    		success : function(msg) {
                                    		},
                                    		error: function() {
                                    		}
                                    	});
    */
                                    });
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

function updateSearchResults(name, value) {
    var where;
    var when;
    var local;
    var social;
    var popularity;
    var price;
    var timeofday;
    
    if (name == 'where') {
        where = value;
    }
    else {
        where = $("#controls #destination").val();
    }
    
    if (name == 'when') {
        when = value;
    }
    else {
        when = $("#controls #calendar").datepicker('getDate');
    }

    if (name == 'local') {
        local = value;
    }
    else {
        local = $("#controls #slider-local").slider('value');
    }
    
    if (name == 'social') {
        social = value;
    }
    else {
        social = $("#controls #slider-social").slider('value');
    }
    
    if (name == 'popularity') {
        popularity = value;
    }
    else {
        popularity = $("#controls #slider-popularity").slider('value');
    }
    
    if (name == 'price') {
        price = value;
    }
    else {
        price = $("#controls #slider-price").slider('value');
    }
    
    if (name == 'timeofday') {
        timeofday = value;
    }
    else {
        timeofday = $("#controls #slider-timeofday").slider('value');
    }
    
    var request_data = {
        'lat': user_html5_latlng.lat(),
        'lng': user_html5_latlng.lng(),
        'where': encodeURIComponent(where),
        'when': encodeURIComponent(when),
        'local': encodeURIComponent(local),
        'social': encodeURIComponent(social),
        'popularity': encodeURIComponent(popularity),
        'price': encodeURIComponent(price),
        'timeofday': encodeURIComponent(timeofday)
    };

	$.getJSON('venues', request_data, function(data) {
    	    var map_icons = {};
    	    map_icons.venue = 'images/venue.png';
            drawPOI(data.venues, user_html5_latlng, venues_map, false, map_icons, venue_markers);
    });
}

$(document).ready(function(){
    $("#the-map").html('<div>Loading...</div>');
	$("#the-map").corner('4px');
	$("#controls #destination").corner('4px');

    $("#venues-table tbody tr:first").hide();

	$('#controls #calendar').datepicker({
	    inline: true, 
	    onSelect: function(date) {
	        updateSearchResults('when', date);
	    }
	});

    var sliderNames = ['local', 'social', 'popularity', 'price', 'timeofday'];
    $.each(sliderNames, function(i, data) {
        $("#slider-" + data).slider({
            range: false, 
            min: 0, 
            max: 7, 
            value: 3, 
            slide: function(event, ui) {
                updateSearchResults(data, ui.value);
            }
        });
    });

    $("#controls #destination").blur(function() {
        updateSearchResults('where', $("#controls #destination").val());
    });

	$(".button.close").each(function(i) {
		$(this).click(function() {
			$(this).colorbox.close();
		});
	});

    renderPlaces();
});

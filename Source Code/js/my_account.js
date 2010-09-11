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
var active_item;
var last_added_venue_id;

function renderGeneralSettings(data) {
    if (data.user_settings) {
        var bean_color = data.user_settings.bean_color;
        var email = data.user_settings.email;
        var twitter = data.user_settings.twitter;
        var venue_unlocked_notifications = data.user_settings.venue_unlocked_notifications;
        var invite_claimed_notifications = data.user_settings.invite_claimed_notifications;
        var deal_available_notifications = data.user_settings.deal_available_notifications;
        var bean_returned_notifications = data.user_settings.bean_returned_notifications;
        
        $("#general-settings-form #beans-color-box").val(bean_color);
        $("#general-settings-form .bean-choice").each(function() {
            $(this).removeClass('selected');
        });
        $("#general-settings-form .bean-choice." + bean_color).addClass('selected');
        $("#general-settings-form #email-box").val(email);
        $("#general-settings-form #twitter-box").val(twitter);
        $("#general-settings-form #venue-unlocked-notifications").attr('checked', venue_unlocked_notifications);
        $("#general-settings-form #invite-claimed-notifications").attr('checked', invite_claimed_notifications);
        $("#general-settings-form #deal-available-notifications").attr('checked', deal_available_notifications);
        $("#general-settings-form #bean-returned-notifications").attr('checked', bean_returned_notifications);
    }
}

function saveGeneralSettings() {
    var postData = {};
    var jsonObject = {};
    jsonObject["action"] = 'write';
    jsonObject["bean_color"] = $(".bean-choice.selected").attr('color');
    jsonObject["email"] = $("#email-box").val();
    jsonObject["twitter"] = $("#twitter-box").val();
    jsonObject["venue_unlocked_notifications"] = $("#general-settings-form #venue-unlocked-notifications").attr('checked');
    jsonObject["invite_claimed_notifications"] = $("#general-settings-form #invite-claimed-notifications").attr('checked');
    jsonObject["deal_available_notifications"] = $("#general-settings-form #deal-available-notifications").attr('checked');
    jsonObject["bean_returned_notifications"] = $("#general-settings-form #bean-returned-notifications").attr('checked');
    postData["post_data"] = JSON.stringify(jsonObject);
    $("#save-status-saving").show();
    $("#save-status-saved").hide();
    $.ajax({
        type : 'POST',
        url : 'user_settings',
        dataType : 'json',
        data : postData,
        success : function(msg) {
            $("#save-status-saving").hide();
            $("#save-status-saved").show();
        }
    });
    return false;
}

function renderFavorite(row, venue_id, name, address_1, address_2, beans, beans_to_unlock, deals, category,
                        is_unlocker, invite_claimed, invite_downloaded,
                        venue_unlocked_notifications, invite_claimed_notifications, 
                        deal_available_notifications, bean_returned_notifications) {
	$(row).attr('venue_id', venue_id);
	
	$(row).removeClass('unfilled');
	$(row).removeClass('filled');
	$(row).addClass('filled');

	$(row + " #venue-details").show();
	$(row + " #add").hide();
	$(row + " #config").show();
	$(row + " #edit").show();
	$(row + " #delete").show();
		
	$(row + " #venue-name").html(name);
	$(row + " #address_1").html(address_1);
	$(row + " #address_2").html(address_2);
    $(row + " #beans").html(beans + ' / ' + beans_to_unlock);
	$(row + " #deals").removeClass('locked unlocked coupons');
	$(row + " #deals").addClass(deals);
	$(row + " #deals").show();
	$(row + " #deals").attr('target', deals);
	$(row + " #deals").attr('is_unlocker', is_unlocker);
	$(row + " #deals").attr('invite_claimed', invite_claimed);
	$(row + " #deals").attr('invite_downloaded', invite_downloaded);
	$(row + " #category").addClass(category);

    $(row).attr('venue_unlocked_notifications', venue_unlocked_notifications);
    $(row).attr('invite_claimed_notifications', invite_claimed_notifications);
    $(row).attr('deal_available_notifications', deal_available_notifications);
    $(row).attr('bean_returned_notifications', bean_returned_notifications);
}

function renderFavoritesTable(data) {
	if (favorites_map == null) {
        $("#favorites-map").html('<div>Loading...</div>');
    }

    if (data.unlocked_first_time_viewed) {
        active_item = data.pos
    	var target = "#unlocked-deals-container-unlocker-firsttime";
        showDealMessage(target, data.unlocked_venue_id);
    }

	$.each(data.favorites, function(i, item) {
		var row = "#favorites-list tbody tr:nth-child(" + (item.pos + 1) + ")";
		renderFavorite(row, 
		               item.venue_id, 
		               item.name, 
		               item.address_1, 
		               item.address_2, 
		               item.beans, 
		               item.beans_to_unlock, 
                       item.deals, 
                       item.category,
                       item.is_unlocker, 
                       item.invite_claimed, 
                       item.invite_downloaded, 
                       item.venue_unlocked_notifications, 
                       item.invite_claimed_notifications, 
                       item.deal_available_notifications, 
                       item.bean_returned_notifications);
	});
	
	$("#favorites-list tbody tr.unfilled div.action#add").show();
	$("#favorites-list tbody tr.unfilled div.action#config").hide();
	$("#favorites-list tbody tr.unfilled div.action#edit").hide();
	$("#favorites-list tbody tr.unfilled div.action#delete").hide();
	$("#favorites-list tbody tr.unfilled div.action#deals").hide();
	$("#favorites-list tbody tr.filled div.action#add").hide();
	$("#favorites-list tbody tr.filled div.action#config").show();
	$("#favorites-list tbody tr.filled div.action#edit").show();
	$("#favorites-list tbody tr.filled div.action#delete").show();
	$("#favorites-list tbody tr.filled div.action#deals").show();

	var has_favorites = hasFavorites(data.favorites);
	getUserLocation(has_favorites, function(user_latlng, ip_geolocation) {
	    var map_icons = {};
	    map_icons.food = "images/favorite_venue.png";
	    map_icons.nightlife = "images/favorite_venue.png";
	    map_icons.shopping = "images/favorite_venue.png";
		renderMap(data.favorites, 
			user_latlng, 
			ip_geolocation, 
			function(myOptions) {
				if (favorites_map == null) {
					favorites_map = new google.maps.Map(document.getElementById("favorites-map"), myOptions);
				}
				return favorites_map;
			}, 
			function(the_map, drawMapMarkers) {
				google.maps.event.addListenerOnce(the_map, 'tilesloaded', function() {
					drawMapMarkers();
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

		if (!has_favorites) {
			//TODO: IP geolocation. If it fails, use null.
			ip_geolocation = false;
		}
	}
	else {

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

function renderMap(data, user_latlng, ip_geolocation, createMap, drawMapMarkers, marker_icons, marker_list) {
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
	drawMapMarkers(the_map, function() {
		var poiMarker;
		var min_max_lat_lng = getNewMinMaxLatLng();
		var has_favorites = false;

		$.each(data, function(i, item) {
			has_favorites = true;
			item_lat = parseFloat(item.lat);
			item_lng = parseFloat(item.lng);
			var my_latlng = new google.maps.LatLng(item_lat, item_lng);
			poiMarker = new google.maps.Marker({
				position: my_latlng,
				map: the_map,
				title: item.name,
				icon: marker_icons[item.category]
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

function resetSearchPanel() {
	$("#search-panel-container").hide();
	$("#no-location-panel-container").hide();
	$("#search-box").val(default_search_tip);
	$("#search-box").removeClass("clicked");
	$("#search-box").one("click", function() {
		$(this).val("").addClass("clicked");
	});
	resetSearchResultsBox();
}

function resetSearchResultsBox() {
}

function usePlace() {
	var row = "#search-results-list tbody tr.clicked";
	var name = $(row + " #venue-name a").html();
	var address_1 = $(row + " #address_1").html();
	var address_2 = $(row + " #address_2").html();
	var beans = -1;
	var deals = "none";
	var contact_level = "high";
	var venue_lat = $(row).attr('venue_lat');
	var venue_lng = $(row).attr('venue_lng');
	var venue_id = $(row).attr('venue_id');
	last_added_venue_id = venue_id;
	var venue_category = $(row).attr('category');

	var row = "#favorites-list tbody tr.clicked";

	if (action == 'update') {
		var prev_venue_id = $(row).attr('venue_id');
		favorite_markers[prev_venue_id].setMap(null);
	}

	var lt = parseFloat(venue_lat);
	var lg = parseFloat(venue_lng);
	var additional_marker = new google.maps.Marker({
		position: new google.maps.LatLng(parseFloat(venue_lat), parseFloat(venue_lng)),
		map: favorites_map,
		title: name,
		icon: 'images/favorite_venue.png'
	});
	favorite_markers[venue_id] = additional_marker;

	var min_max_lat_lng = getNewMinMaxLatLng();
	min_max_lat_lng = findMinMaxLatLng(favorite_markers, 
		function(item) {
			return item.getPosition().lat();
		}, 
		function(item) {
			return item.getPosition().lng();
		}
	);
	var sw = new google.maps.LatLng(min_max_lat_lng.min_lat, min_max_lat_lng.min_lng);
	var ne = new google.maps.LatLng(min_max_lat_lng.max_lat, min_max_lat_lng.max_lng);
	bounds = new google.maps.LatLngBounds(sw, ne);
	favorites_map.fitBounds(bounds);

	var postData = {};
	var jsonObject = {};
	jsonObject["action"] = action;
	jsonObject["venue_id"] = parseInt(venue_id);
	jsonObject["name"] = name;
	jsonObject["category"] = venue_category;
	jsonObject["address_1"] = address_1;
	jsonObject["address_2"] = address_2;
	jsonObject["lat"] = venue_lat;
	jsonObject["lng"] = venue_lng;
	jsonObject["contact_level"] = contact_level_default;
	jsonObject["pos"] = favorite_pos;
	postData["post_data"] = JSON.stringify(jsonObject);
	$.ajax({
		type : 'POST',
		url : 'venue_update',
		dataType : 'json',
		data : postData,
		success : function(msg) {
        	$.get('venue_beans', {venue_id: venue_id}, function(data) {
        		    var beans = parseInt(data.bean_count);
        		    var beans_to_unlock = data.beans_to_unlock;
                    var deals = data.deals;
                	renderFavorite(row, venue_id, name, address_1, address_2, beans, beans_to_unlock, deals, venue_category, contact_level, true, true, true, true);

                	$("#favorites-list tbody tr").removeClass("clicked");
                	resetSearchPanel();

                    if (msg.unlocked_first_time_viewed) {
                		var target = '#unlocked-deals-container-unlocker-firsttime';
                        showDealMessage(target, msg.unlocked_venue_id);
                	}
                	else {
                    	$.colorbox.close();
                	}
        		}, 
        		'json'
        	);
		}
	});
}

function findPlace() {
	resetSearchResultsBox();
	$.each(search_markers, function(i, item) {
		item.setMap(null);
	});

	if (template_html_favs_addr.length == 0) {
		template_html_favs_addr = $("#search-results-list #template-row").html();
	}
	$("#search-results-list tbody").html("");
	getUserLocation(false, function(user_latlng) {
	    if (user_latlng != null) {
			$("#search-panel-container").show();
			$("#no-location-panel-container").hide();
            createSearchMap(user_latlng, function() {
                findPlaceSimple(user_latlng);
            });
	    }
	    else {
	        if (user_zip_code_latlng != null) { // coordinates might be available from previous searches
    			$("#search-panel-container").show();
    			$("#no-location-panel-container").hide();
                createSearchMap(user_zip_code_latlng, function() {
                    findPlaceSimple(user_zip_code_latlng);
                });
	        }
	        else {
    			$("#search-panel-container").hide();
    			$("#no-location-panel-container").show();
	        }
	    }
	});
	return false;
}

function createSearchMap(user_latlng, callback) {
    var myOptions = {
		zoom: 12,
		center: new google.maps.LatLng(user_latlng.lat(), user_latlng.lng()),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	search_map = new google.maps.Map(document.getElementById("search_map"), myOptions);
	google.maps.event.addListenerOnce(search_map, 'tilesloaded', function() {
	    callback();
	});
}

function findPlaceSimple(user_latlng) {
	var lat = user_latlng.lat();
	var lng = user_latlng.lng();
	var q = $("#search-box").val();
	var q_param;
	if (default_search_tip == q || '' == q) {
	    q_param = '';
	}
	else {
    	q_param = '&q=' + escape(q);
	}
	var url = 'venue_search?geolat=' + lat + '&geolong=' + lng + q_param + '&l=50';

	$.getJSON(url, showFoundPlaces);
}

function filterSearchResults(category) {
	if (category == 'all') {
    	$("#search-results-list tbody tr[category!='" + category + "']").show();
	}
	else {
    	$("#search-results-list tbody tr[category!='" + category + "']").hide();
	}
	$("#search-results-list tbody tr[category='" + category + "']").show();
	
	//TODO: Filter map markers
	$.each(search_markers, function(i, item) {
    	if (category != 'all') {
    	    if (item.getIcon().indexOf(category) == -1) {
        	    item.setMap(null);
    	    }
    	    else {
        	    item.setMap(search_map);
    	    }
    	}
    	else {
    	    item.setMap(search_map);
    	}
	});
	
	return false;
}

function lookupZipCode() {
    var zip_code = $("#zip-code-lookup-box").val();

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

function saveSettingsForFavorite() {
    $("#favorite-venue-settings-form #save-status-saving").show();
    $("#favorite-venue-settings-form #save-status-saved").hide();
    var postData = {};
    var jsonObject = {};
    jsonObject["action"] = 'update_venue_config';
    jsonObject["pos"] = active_item;
    jsonObject["venue_unlocked_notifications"] = $("#favorite-venue-settings-form #venue-unlocked-notifications").attr('checked');
    jsonObject["invite_claimed_notifications"] = $("#favorite-venue-settings-form #invite-claimed-notifications").attr('checked');
    jsonObject["deal_available_notifications"] = $("#favorite-venue-settings-form #deal-available-notifications").attr('checked');
    jsonObject["bean_returned_notifications"] = $("#favorite-venue-settings-form #bean-returned-notifications").attr('checked');
    postData["post_data"] = JSON.stringify(jsonObject);
    $.ajax({
        type : 'POST',
        url : 'venue_update',
        dataType : 'json',
        data : postData,
        success : function(msg) {
    		var row = "#favorites-list tbody tr:nth-child(" + (active_item + 1) + ")";
            $(row).attr('venue_unlocked_notifications', jsonObject["venue_unlocked_notifications"]);
            $(row).attr('invite_claimed_notifications', jsonObject["invite_claimed_notifications"]);
            $(row).attr('deal_available_notifications', jsonObject["deal_available_notifications"]);
            $(row).attr('bean_returned_notifications', jsonObject["bean_returned_notifications"]);
            $("#favorite-venue-settings-form #save-status-saving").hide();
            $("#favorite-venue-settings-form #save-status-saved").show();
        }
    });
}

function showDealMessage(target, venue_id) {
	$.colorbox({width: "600px", 
				opacity: 0.6, 
				transition: "elastic",
				speed: 200,
				inline: true, 
				overlayClose: false,
				href: target,
				onComplete: function() {
					$("#cboxContent").corner("10px");
					$("#cboxLoadedContent").corner("6px");
					if (target == '#unlocked-deals-container-unlocker-firsttime') {
                        var postData = {};
                        var jsonObject = {};
                        jsonObject["action"] = 'mark_unlock_seen';
                        jsonObject["venue_id"] = venue_id;
                        postData["post_data"] = JSON.stringify(jsonObject);
                        $.ajax({
                            type : 'POST',
                            url : 'unlock',
                            dataType : 'json',
                            data : postData,
                            success : function(msg) {}
                        });
					}
				}
	});
}

function addPlace(clicked_obj, actn, i) {
	resetSearchPanel();
	action = actn;
	$("#favorites-list tbody tr").removeClass("clicked");
	favorite_pos = i;
	clicked_obj.parents("tr").addClass("clicked");
	$.colorbox({width: "1000px",
				height: "80%",
				opacity: 0.6,
				transition: "elastic",
				speed: 200,
				inline: true,
				overlayClose: false,
				href: "#add-place-container",
				onComplete: function() {
					$("#cboxContent").corner("10px");
					$("#cboxLoadedContent").corner("6px");
					findPlace();
				}
	});
}

function configPlace(i) {
    active_item = i;
    var row = "#favorites-list tbody tr:nth-child(" + (active_item + 1) + ")";
    var venue_unlocked_notifications = $(row).attr('venue_unlocked_notifications');
    var invite_claimed_notifications = $(row).attr('invite_claimed_notifications');
    var deal_available_notifications = $(row).attr('deal_available_notifications');
    var bean_returned_notifications = $(row).attr('bean_returned_notifications');
    $("#venue-config-container #venue-unlocked-notifications").attr('checked', (venue_unlocked_notifications == 'true'));
    $("#venue-config-container #invite-claimed-notifications").attr('checked', (invite_claimed_notifications == 'true'));
    $("#venue-config-container #deal-available-notifications").attr('checked', (deal_available_notifications == 'true'));
    $("#venue-config-container #bean-returned-notifications").attr('checked', (bean_returned_notifications == 'true'));
    $("#favorite-venue-settings-form #save-status-saving").hide();
    $("#favorite-venue-settings-form #save-status-saved").hide();
	$.colorbox({width: "600px", 
				opacity: 0.6, 
				transition: "elastic", 
				speed: 200, 
				inline: true, 
				overlayClose: false,
				href: '#venue-config-container',
				onComplete: function() {
					$("#cboxContent").corner("10px");
					$("#cboxLoadedContent").corner("6px");
				}
	});
}
    
function deletePlace(i) {
	row = '#favorites-list tbody tr:nth-child(' + (i + 1) + ')';
	
	venue_id = $(row).attr('venue_id');
	if (favorite_markers[venue_id]) {
    	favorite_markers[venue_id].setMap(null);
	}
	
	$(row + " #venue-name").empty();
	$(row + " #address_1").empty();
	$(row + " #address_2").empty();
	$(row + " #venue-details").hide();
	$(row + " #beans").empty();
	$(row + " #deals").empty();
	$(row + " #category").removeClass('food nightlife shopping');
	$(row + " #add").show();
	$(row + " #config").hide();
	$(row + " #edit").hide();
	$(row + " #delete").hide();
	$(row + " #deals").hide();
	
	var postData = {};
	var jsonObject = {};
	jsonObject["action"] = 'delete';
	jsonObject["venue_id"] = venue_id;
	jsonObject["pos"] = i;
	postData["post_data"] = JSON.stringify(jsonObject);
	$.ajax({
		type : 'POST',
		url : 'venue_update',
		dataType : 'json',
		data : postData,
		success : function(msg) {
		}
	});
}

function showFoundPlaces(data) {
	$("#search-results-box").css("visibility", "visible");
	
	$.each(data.groups[0].venues, function(i, item) {
		if (item.primarycategory != null && item.primarycategory.fullpathname != null) {
			var category_path = item.primarycategory.fullpathname.split(':');
			var category = category_path[0].toLowerCase();
			if (category == 'shops') {
				category = 'shopping';
			}
			if (item.primarycategory.fullpathname.toLowerCase().indexOf('food') != -1) {
				category = 'food';
			}
		}
		if (category == 'shopping' || category == 'food' || category == 'nightlife') {
			$("#search-results-list tbody").append(template_html_favs_addr);
			$("#search-results-list tbody tr:last div#venue-name a").html(item.name).click(function() {
				$(this).parents("tr").addClass("clicked");
				usePlace();
			});
			var zip_code = '';
			if ('zip' in item) {
				zip_code = item.zip;
			}
			$("#search-results-list tbody tr:last div#address_1").html(item.address);
			$("#search-results-list tbody tr:last div#address_2").html($.trim(item.city + ', ' + item.state + ' ' + zip_code));
			$("#search-results-list tbody tr:last div#category").addClass(category);
			$("#search-results-list tbody tr:last").attr('venue_id', item.id);
			$("#search-results-list tbody tr:last").attr('category', category);
			$("#search-results-list tbody tr:last").attr('venue_lat', item.geolat);
			$("#search-results-list tbody tr:last").attr('venue_lng', item.geolong);

			item.venue_id = item.id;
			item.category = category;
			item.lat = item.geolat;
			item.lng = item.geolong;
		}
	});
	
	var has_favorites = hasFavorites(data.groups[0].venues);
	getUserLocation(has_favorites, function(user_latlng, ip_geolocation) {
	    var map_icons = {};
	    map_icons.food = "images/search_food.png";
	    map_icons.nightlife = "images/search_nightlife.png";
	    map_icons.shopping = "images/search_shopping.png";
		renderMap(data.groups[0].venues, 
			user_latlng, 
			ip_geolocation, 
			function(myOptions) {
				return search_map;
			}, 
			function(the_map, drawMapMarkers) {
				//TODO: This is assuming the map will finish loading its tiles before the user has managed to initiate a search.
				drawMapMarkers();
			}, map_icons, 
			search_markers
		);
	});
}

function claimInvite(venue_id) {
    var postData = {};
    var jsonObject = {};
    jsonObject["action"] = 'claim_invite';
    jsonObject["venue_id"] = venue_id;
    postData["post_data"] = JSON.stringify(jsonObject);
    $.ajax({
        type : 'POST',
        url : 'unlock',
        dataType : 'json',
        data : postData,
        success : function(msg) {
            var target = '#invite-claim-failure';
            if (msg.succeeded) {
                target = '#invite-claim-success';
            }
        	$.colorbox({width: "600px", 
        				opacity: 0.6, 
        				transition: "elastic", 
        				speed: 200, 
        				inline: true, 
        				overlayClose: false,
        				href: target,
        				onComplete: function() {
        					$("#cboxContent").corner("10px");
        					$("#cboxLoadedContent").corner("6px");
        				}
        	});
        }
    });
}

function downloadInvite(venue_id) {
    var jsonObject = {};
    jsonObject["action"] = 'download_invite';
    jsonObject["venue_id"] = venue_id;
    window.location = 'unlock?post_data=' + JSON.stringify(jsonObject);
    var target = '#invite-downloaded-tips';
	$.colorbox({width: "600px", 
				opacity: 0.6, 
				transition: "elastic", 
				speed: 200, 
				inline: true, 
				overlayClose: false,
				href: target,
				onComplete: function() {
					$("#cboxContent").corner("10px");
					$("#cboxLoadedContent").corner("6px");
				}
	});
}

function renderTab(content_id) {
    $(".tab-container").each(function() {
        $(this).removeClass('show-contents');
    });
    $("#" + content_id).addClass('show-contents');

    if (content_id == 'general-settings') {
        $.getJSON('user_settings', renderGeneralSettings);
    }
    else if (content_id == 'favorites-settings') {
    	var postData = {};
    	var jsonObject = {};
    	jsonObject["added_venue_id"] = $("#favorites-list").attr('added_venue_id');
    	postData["post_data"] = JSON.stringify(jsonObject);
    	$.ajax({
    		type : 'POST',
    		url : 'venues_list',
    		dataType : 'json',
    		data : postData,
    		success : renderFavoritesTable
    	});
    }
}

$(document).ready(function(){
	$("div.menu-item").corner("top 4px");
	$(".bean-choice").corner("4px");

	var favorites_list_html = "";
	var template_html_row = $("#favorites-list #template-row").html();
	for (var i=0; i<10; i++) {
		favorites_list_html = favorites_list_html + template_html_row;
	}
	
	last_added_venue_id = $("#favorites-list").attr('added_venue_id');
	
	$("#favorites-list tbody").html(favorites_list_html);

	$("#favorites-list #add").each(function(i) {
		$(this).click(function() {
		    active_item = i;
			addPlace($(this), 'insert', i);
		});
	});
	$("#favorites-list #config").each(function(i) {
		$(this).click(function() {
			configPlace(i);
		});
	});
	$("#favorites-list #edit").each(function(i) {
		$(this).click(function() {
			addPlace($(this), 'update', i);
		});
	});
	$("#favorites-list #delete").each(function(i) {
		$(this).click(function() {
			deletePlace(i);
		});
	});
	$("#favorites-list #deals").each(function(i) {
		$(this).click(function() {
            active_item = i;
            var row = "#favorites-list tbody tr:nth-child(" + (active_item + 1) + ")";
            var venue_id = $(row).attr('venue_id');
            var deal_status = $(this).attr('target');
            var is_unlocker = $(this).attr('is_unlocker');
            var invite_claimed = $(this).attr('invite_claimed');
            var invite_downloaded = $(this).attr('invite_downloaded');
            var target;
            if (deal_status == 'unlocked') {
                if (invite_downloaded == 'true') {
        			target = '#invite-downloaded-tips';
                }
                else if (invite_claimed == 'true') {
                    if (is_unlocker == 'true') {
            			target = '#invite-claim-success';
                    }
                    else {
            			target = '#invite-claimed-already-others';
                    }
                }
                else if (is_unlocker == 'true') {
        			target = '#unlocked-deals-container-me';
                }
                else {
        			target = '#unlocked-deals-container-others';
                }
            }
            else {
    			target = "#" + deal_status + '-deals-container';
            }
		    showDealMessage(target, venue_id);
		});
	});
	$(".button.close").each(function(i) {
		$(this).click(function() {
			$(this).colorbox.close();
		});
	});
	$(".menu-item").each(function() {
        var content_id = $(this).attr('content_id');
		$(this).click(function() {
        	$(".menu-item").each(function() {
                $(this).removeClass('selected');
            });
            $(this).addClass('selected');
            renderTab(content_id);
		});
	});
	$(".bean-choice").each(function(i) {
		$(this).click(function() {
            $(".bean-choice").each(function() {
                $(this).removeClass('selected');
            });
			$(this).addClass('selected');
		});
	});
	$("#venue-config-container #save-settings-button").click(function() {
	    saveSettingsForFavorite();
	});
    $(".button.claim-invite").each(function() {
        $(this).click(function() {
            var row = "#favorites-list tbody tr:nth-child(" + (active_item + 1) + ")";
            var venue_id = $(row).attr('venue_id');
            claimInvite(venue_id);
        });
    });
    $(".button.download").each(function() {
        $(this).click(function() {
            var row = "#favorites-list tbody tr:nth-child(" + (active_item + 1) + ")";
            var venue_id = $(row).attr('venue_id');
            downloadInvite(venue_id);
        });
    });

    $("#general-settings-form").submit(saveGeneralSettings);
	$("#find-place").submit(findPlace);
	$("#get-zip-code").submit(lookupZipCode);

	$("#search-filter-food").click(function() {
		filterSearchResults('food');
	});
	$("#search-filter-nightlife").click(function() {
		filterSearchResults('nightlife');
	});
	$("#search-filter-shopping").click(function() {
		filterSearchResults('shopping');
	});
	$("#search-filter-all").click(function() {
		filterSearchResults('all');
	});

    $("#general-settings").height('550px');
    $("#favorites-settings").height('550px');

	resetSearchPanel();
	
    var content_id = $(".menu-item.selected").attr('content_id');
    renderTab(content_id);
});

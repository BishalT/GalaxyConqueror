// Global Values
var FARM_MINIMUM = 10;
var planet_values = {
    year: {
        year_count: 0,
    },
    resources: {
        stone_count: 100,
        wood_count: 100,
        food_count: 100,
    },
    population: {
        population_count: 30,
        max_count: 50,
    },
    buildings: {
        quarry_count: 0,
        farm_count: 0,
        forester_count: 0,
    },
    storage: {
        barn_count: 1,
        mill_count: 1,
        stockpile_count: 1,
    },
    houses:{
        hut_count: 10,
        house_count: 0,
        mansion_count: 0,
    }
};

var prod_type = {
    stone: "quarry",
    wood: "forester",
    food: "farm",
}

var storage_type = {
    stone: "stockpile",
    food: "barn",
    wood: "mill"
}

var resource_max = {
    stone: 250,
    wood: 250,
    food: 500,
}

var prod_upgrades = {
    quarry: 1,
    farm: 3,
    forester: 1,
}

// cost of each building
var building_costs = {
    quarry: {
        wood: 50
    },
    farm: {
        wood: 10,
        stone: 10
    },
    forester: {
        wood: 25,
        stone: 25,
    },
    barn: {
        wood: 50,
        stone: 50,
    },
    stockpile: {
        stone: 50
    },
    mill: {
        wood: 50
    },
    hut: {
        wood: 20,
        stone: 20,
    },
    house: {
        wood: 100,
        stone: 100,
    },
    mansion: {
        wood: 1000,
        stone: 1000,
    }
}


function reset_game(){
    var confirmed = confirm("Do you wish to reset?")
    if(!confirmed){
        return;
    }
    planet_values = {
        year: {
            year_count: 0,
        },
        resources: {
            stone_count: 100,
            wood_count: 100,
            food_count: 100,
        },
        population: {
            population_count: 30,
            max_count: 30,
        },
        buildings: {
            quarry_count: 0,
            farm_count: 0,
            forester_count: 0,
        },
        storage: {
            barn_count: 1,
            sawmill_count: 1,
            stockpile_count: 1,
        },
        houses:{
            hut_count: 10,
            house_count: 0,
            mansion_count: 0,
        }
    };
    write_values();
}


function deleteSave(){
    document.cookie = ['save_galaxy', '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.', window.location.host.toString()].join('');
    localStorage.removeItem('save_galaxy');
}

function bake_cookie(name, value) {
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + 30);
	var cookie = [name, '=', JSON.stringify(value),'; expires=.', exdate.toUTCString(), '; domain=.', window.location.host.toString()].join('');
    document.cookie = cookie;
    // console.log("bake_ " + cookie)
}

function read_cookie(name) {
	var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
    result && (result = JSON.parse(result[1]));
    // console.log("read_ " + result)
	return result;
}

function readSavedData(data){
    planet_values = data;
}

$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();   
});

function write_values(){
    for(category in planet_values){
        Object.keys(planet_values[category]).forEach(function(item){
            upper_elem = item.replace(/^\w/, c => c.toUpperCase());
            console.log(category, item, planet_values[category][item])
            update_values(upper_elem.split("_")[0], planet_values[category][item]); 
        });
    }
}

// Initalize Values
window.onload = function(){
    // if no save exists, then create a new one
    if(read_cookie("save_galaxy") == null){
        bake_cookie("save_galaxy", planet_values)
    } else { // else read from it
        readSavedData(read_cookie("save_galaxy"));
    }
    write_values();
    $("#default-open").click();
};

// auto-save minute
window.setInterval(function(){
    deleteSave();
    bake_cookie("save_galaxy", planet_values)
    console.log("Saved");
}, 60000);

// auto-increase year every 5 seconds
window.setInterval(function(){
    planet_values["year"]["year_count"] += 1;
    update_values("Year", planet_values["year"]["year_count"]);
}, 5000);


// Update function every second
// TODO: Make better population algorithm
function update_population(){
    if(planet_values["buildings"]["farm_count"] < FARM_MINIMUM)
        return;
    
    var _food = planet_values["resources"]["food_count"];
    if(_food == 0){
        planet_values["population"]["population_count"] -= 1;
        update_values("Population", planet_values["population"]["population_count"]);
        update_values("Food", planet_values["resources"]["food_count"]);
        return;
    }

    var _pop_count = planet_values["population"]["population_count"];
    var _food_rate = planet_values["buildings"]["farm_count"] * prod_upgrades["farm"];

    // if the production rate of food is less
    if(_food_rate < _pop_count ){
        var difference = Math.abs(_food_rate - _pop_count);
        // logaithmic decline of population per base 10
        var loss = Math.floor(Math.log10(difference));
        if(planet_values["population"]["population_count"] - loss == 0){
            planet_values["population"]["population_count"] = 0;
        }
        else {
            planet_values["population"]["population_count"] -= loss;
        }

    }

    update_values("Population", planet_values["population"]["population_count"]);

};

function update_resource_count(elem){
    var elemLower = elem.toLowerCase();
    // translate the type of production from the resource
    var type = prod_type[elemLower];
    var prod_count = planet_values["buildings"][type+"_count"];
    var prod_rate = prod_count * prod_upgrades[type];
    // food case, actual production rate = production rate - consumption rate
    if(elemLower == "food" && planet_values["buildings"]["farm_count"] >= FARM_MINIMUM){
        prod_rate -= planet_values["population"]["population_count"];
    }
    var stor_type = storage_type[elemLower];
    var stor_value = planet_values["storage"][stor_type+"_count"];
    resource_max[elemLower] = stor_value * 250;

    if(planet_values["resources"][elemLower+"_count"] + prod_rate > resource_max[elemLower]){
        planet_values["resources"][elemLower+"_count"] = resource_max[elemLower]
    } 
    else {
        planet_values["resources"][elemLower+"_count"] += prod_rate;
        // in the case that it is 0 or less
        if (planet_values["resources"][elemLower+"_count"] <= 0){
            planet_values["resources"][elemLower+"_count"] = 0;
        }
    }
    update_values(elem, planet_values["resources"][elemLower+"_count"]);
    update_rates(elemLower, prod_rate);
    update_max(elemLower, resource_max[elemLower]);
}

// incremental update function
window.setInterval(function(){

    Object.keys(planet_values["resources"]).forEach(function(item){
        upper_elem = item.replace(/^\w/, c => c.toUpperCase());
        update_resource_count(upper_elem.split("_")[0]); 
    });

    update_population();
  }, 1000);


function check_valid(elem, count){
    var save_count_value = count.value;
    var element = building_costs[elem.split("_")[0]];
    var valid = 1;
    var minimum_create = {};
    for(req in element){
        var res = planet_values["resources"][req+"_count"];

        // if not enough required, find the minimum that can be made
        minimum_create[req] = Math.floor(res/(element[req])); 
    
        if(res - (element[req] * count.value) < 0){
            valid = 0;
        }
    }

    if(!valid && count.value == 1){
        return 0;
    }

    if(!valid){
        for(req in minimum_create){
            if(count.value > minimum_create[req]){
                count.value = minimum_create[req];
            }
        }
        if(count.value == 0)
            return;
    }

    if(count.value > save_count_value)
        count.value;


    for(req in element)
        planet_values["resources"][req+"_count"] -= element[req] * count.value;
    
    return 1;
}

function check_valid_pop(){
    var lessThanMax = planet_values["population"]["population_count"] < planet_values["population"]["max_count"];
    var enoughFood = planet_values["resources"]["food_count"] >= 20;
    if(lessThanMax && enoughFood){
        return 1;
    }
    return 0;
}

function check_valid_resource(elem){
    var red = elem.split("_")[0];
    if(planet_values["resources"][elem] + 1 > resource_max[red])
        return 0;
    return 1;
}

function perform_action(category, elem, count){
    var valid_action = 1;
    var countObj = {value: count};
    if(category == "buildings" || category == "houses" || category == "storage"){
        valid_action = check_valid(elem, countObj);
    }
    if(category == "population") {
        valid_action = check_valid_pop()
    }

    if(category == "resources"){
        valid_action = check_valid_resource(elem);
    }
    
    if(!valid_action)
        return;

    planet_values[category][elem] += countObj.value;
    if(category == "houses"){
        update_max_pop(category, elem);
    }
    // upper_case the 1st letter
    upper_elem = elem.replace(/^\w/, c => c.toUpperCase());
    update_values(upper_elem.split("_")[0], planet_values[category][elem]);
}

function update_values(elem, count){
    var updateVal = elem+": "+count;
    if(elem == "max"){
        updateVal = "Max: " + count;
    }
    $("."+elem.toLowerCase()+"-count")[0].textContent = updateVal;
}

function update_rates(elem, rate){
    var updateRate = rate.toFixed(1) + "/s";
    $("."+elem+'-rate')[0].textContent = updateRate;
}

function update_max(elem, max){
    var updateMax = "max: " + max;
    $('.'+elem+'-max')[0].textContent = updateMax;
}

function update_max_pop(category, elem){
    var increase = 0;
    switch(elem){
        case "hut_count":
            increase = 5;
            break;
        case "house_count":
            increase = 10;
            break;
        case "mansion_count":
            increase = 25;
            break;
    }
    planet_values["population"]["max_count"] += increase;
    update_values("max", planet_values["population"]["max_count"]);
}

function open_tab(evt, tabName, tabsNum) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    if(tabsNum == 1){
        tabcontent = $(".tabcontent");
        tablinks = $(".tablinks");
    }
    else {
        tabcontent = $(".tabcontent"+tabsNum);
        tablinks = $(".tablinks"+tabsNum);
    }
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    // Show the current tab, and add an "active" class to the button that opened the tab
    $("#"+tabName)[0].style.display = "block";
    evt.currentTarget.className += " active";
  }
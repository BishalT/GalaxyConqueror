// Global Values
var planet_values = {
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
    houses:{
        hut_count: 10,
        house_count: 0,
        mansion_count: 0,
    }
};

var prod_upgrades = {
    quarry: 1,
    farm: 1,
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

function write_values(){
    for(category in planet_values){
        Object.keys(planet_values[category]).forEach(function(item){
            upper_elem = item.replace(/^\w/, c => c.toUpperCase());
            console.log(category, item, planet_values[category][item])
            update_values(upper_elem.split("_")[0], planet_values[category][item]); 
        });
    }
}
function reset_game(){
    var confirmed = confirm("Do you wish to reset?")
    if(!confirmed){
        return;
    }
    planet_values = {
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

// Initalize Values
window.onload = function(){
    // if no save exists, then create a new one
    if(read_cookie("save_galaxy") == null){
        bake_cookie("save_galaxy", planet_values)
    } else { // else read from it
        readSavedData(read_cookie("save_galaxy"));
    }
    write_values();
};

// auto-save 10mins
window.setInterval(function(){
    deleteSave();
    bake_cookie("save_galaxy", planet_values)
}, 10000);

// Update function every second
// TODO: Make better population algorithm
function update_population(){
    if(planet_values["buildings"]["farm_count"] < 10)
        return;
    
    if(planet_values["resources"]["food_count"] == 0){
        planet_values["population"]["population_count"] -= 1;
    }

    if(planet_values["population"]["population_count"] > planet_values["resources"]["food_count"]){
        planet_values["population"]["population_count"] -= Math.ceil(planet_values["resources"]["food_count"]/4);
        planet_values["resources"]["food_count"] -= Math.ceil(planet_values["resources"]["food_count"]/4);
    }
    else {
        planet_values["population"]["population_count"] += Math.ceil(planet_values["resources"]["food_count"]/2);
        planet_values["resources"]["food_count"] -= Math.ceil(planet_values["resources"]["food_count"]/2);
    }
    update_values("Population", planet_values["population"]["population_count"]);
    update_values("Food", planet_values["resources"]["food_count"]);
};

function update_resource_stone(){
    var quarry_count = planet_values["buildings"]["quarry_count"];
    planet_values["resources"]["stone_count"] += quarry_count * prod_upgrades["quarry"];
    update_values("Stone", planet_values["resources"]["stone_count"]);
    update_rates("stone", prod_upgrades["quarry"] * quarry_count);
}

function update_resource_wood(){
    var forester_count = planet_values["buildings"]["forester_count"];
    planet_values["resources"]["wood_count"] += forester_count  * prod_upgrades["forester"];
    update_values("Wood", planet_values["resources"]["wood_count"]);
    update_rates("wood", prod_upgrades["forester"] * forester_count);
}

function update_resource_food(){
    var farm_count = planet_values["buildings"]["farm_count"];
    planet_values["resources"]["food_count"] += farm_count * prod_upgrades["farm"];
    update_values("Food", planet_values["resources"]["food_count"]);
    update_rates("food", prod_upgrades["farm"] * farm_count);
}

// incremental update function
window.setInterval(function(){
    update_resource_stone();
    update_resource_wood();
    update_resource_food();
    update_population();
  }, 1000);


// Updating Values individually
function check_valid(elem){
    var element = building_costs[elem.split("_")[0]];
    for(req in element){
        var res = planet_values["resources"][req+"_count"];
        if(res - element[req] < 0){
            return 0;
        }
    }

    for(req in element)
        planet_values["resources"][req+"_count"] -= element[req];
    
    return 1;
}

function check_valid_pop(){
    if(planet_values["population"]["population_count"] < planet_values["population"]["max_count"]){
        return 1;
    }
    return 0;
}

function perform_action(category, elem){
    var valid_action = 1;
    if(category == "buildings" || category == "houses"){
        valid_action = check_valid(elem);
    }
    if(category == "population") {
        valid_action = check_valid_pop()
    }
    
    if(!valid_action)
        return;

    planet_values[category][elem] += 1;
    if(category == "houses"){
        update_max_pop(category, elem);
    }
    // upper_case the 1st letter
    upper_elem = elem.replace(/^\w/, c => c.toUpperCase());
    update_values(upper_elem.split("_")[0], planet_values[category][elem]);
}

function update_values(elem, count){
    var updateVal = elem+": "+count
    if(elem == "max"){
        updateVal = "Max: " + count
    }
    document.getElementsByClassName(elem.toLowerCase()+"-count")[0].textContent = updateVal;
}

function update_rates(elem, rate){
    var updateRate = rate.toFixed(1) + "/s";
    $("."+elem+'-rate')[0].textContent = updateRate;
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

function openCity(evt, cityName) {
    // Declare all variables
    var i, tabcontent, tablinks;
  
    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
  }
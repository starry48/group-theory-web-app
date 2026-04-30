function composePerm(p1 , p2){
    const result = [0,0,0,0]
    for (let x = 0; x < 4; x ++){
        result[x] = p2[p1[x]]
    }
    return result 

}

function invertPerm(p){
    const result = [0,0,0,0]
    for (let x = 0; x < 4; x ++){
        result[p[x]] = 1
    }
    return result
}


function orderofPerm(p){

}

function permAreEqual(p1, p2){

}


function cycleNotation(p){


}

function generateS4(){


}

function randoTargetPerm(){

    
}
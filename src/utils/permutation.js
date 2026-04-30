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
        result[p[x]] = x
    }
    return result
}


function orderofPerm(p){
    const curr = [...p]
    const iden = [0, 1, 2, 3]
    const count = 1 
    while (!permAreEqual(curr, iden)){
        curr = composePerm(curr, p)
        count++
        if (count > 24){
            break
        }
    } 
    return count 
}

function permAreEqual(p1, p2){
    return p1[0]==p2[0] && p1[1]==p2[1] && p1[2]==p2[2] && p1[3]==p2[3]
}


function cycleNotation(p){
    const visit = [false, false, false, false]
    const cycles = []
    for (let x = 0; x < 4; x ++){
        if (visit[x]){
            continue
        }
        const cycle = []
        const y = x 
        while (!visit[y]){
            visit[y] = true 
            cycle.push(y + 1)
            y = p[y]
        }

        if (cycle.length > 1){
            cycles.push("(" + cycle.join(" ") + ")")

        }
    }

    if (cycles.length == 0){
        return 
    }

    return cycles.join("")

}

function generateS4(){


}

function randoTargetPerm(){


}
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
        let y = x 
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
        return "e"
    }

    return cycles.join("")

}

function generateS4(){
    const result = []
    function perm(arr, start){
        if (start == arr.length){
            result.push([...arr])
            return
        }

        for (let x = start; x < arr.length; x++) {
            // swap
            let temp = arr[start]
            arr[start] = arr[x]
            arr[x] = temp

            perm(arr, start + 1)

            // swap back
            let temp2 = arr[start]
            arr[start] = arr[x]
            arr[x] = temp2
        }
    }

    perm([0, 1, 2, 3], 0)
    return result
}


function randoTargetPerm(){
    const all = generateS4()
    const identity = [0, 1, 2, 3]
    let pick

    // keep picking until we get something that isn't the identity
    do {
        const index = Math.floor(Math.random() * all.length)
        pick = all[index]
    } while (permAreEqual(pick, identity))

    return pick

} 
export { composePerm, invertPerm, orderofPerm, permAreEqual, cycleNotation, generateS4, randoTargetPerm }
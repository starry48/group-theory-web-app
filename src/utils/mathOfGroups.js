function modAdd(a,b, mod){
    return (a + b) % mod
}


function modMul(a, b, mod){
    return (a * b) % mod
}


export function z12Add(a, b){
    return (a + b) % 12
}


export function z12Subgroup(divisor){
    const subgroup = []
    const step = 12 / divisor
    
    for (let i = 0; i < 12; i += step) {
        subgroup.push(i)
    
    }
    return subgroup   
}

// elements: r0=identity, r1=90°, r2=180°, r3=270°, s0=horiz, s1=vert, s2=diag, s3=antidiag
export const D4_ELEMENTS = ["r0", "r1", "r2", "r3", "s0", "s1", "s2", "s3"]
//precomputed mult table for d4
const D4_TABLE = {
    r0: { r0:"r0", r1:"r1", r2:"r2", r3:"r3", s0:"s0", s1:"s1", s2:"s2", s3:"s3" },
    r1: { r0:"r1", r1:"r2", r2:"r3", r3:"r0", s0:"s2", s1:"s3", s2:"s1", s3:"s0" },
    r2: { r0:"r2", r1:"r3", r2:"r0", r3:"r1", s0:"s1", s1:"s0", s2:"s3", s3:"s2" },
    r3: { r0:"r3", r1:"r0", r2:"r1", r3:"r2", s0:"s3", s1:"s2", s2:"s0", s3:"s1" },
    s0: { r0:"s0", r1:"s3", r2:"s1", r3:"s2", s0:"r0", s1:"r2", s2:"r1", s3:"r3" },
    s1: { r0:"s1", r1:"s2", r2:"s0", r3:"s3", s0:"r2", s1:"r0", s2:"r3", s3:"r1" },
    s2: { r0:"s2", r1:"s0", r2:"s3", r3:"s1", s0:"r3", s1:"r1", s2:"r0", s3:"r2" },
    s3: { r0:"s3", r1:"s1", r2:"s2", r3:"s0", s0:"r1", s1:"r3", s2:"r2", s3:"r0" },
}

export function d4Mult(a, b){
    return D4_TABLE[a][b]
}

export function d4Subgroup(){
     return [
        ["r0"],                               // trivial subgroup, order 1
        ["r0", "r2"],                         // order 2 — 180° rotation
        ["r0", "s0"],                         // order 2 — horizontal reflection
        ["r0", "s1"],                         // order 2 — vertical reflection
        ["r0", "s2"],                         // order 2 — diagonal reflection
        ["r0", "s3"],                         // order 2 — anti-diagonal reflection
        ["r0", "r1", "r2", "r3"],             // order 4 — all rotations
        ["r0", "r2", "s0", "s1"],             // order 4 — Klein four-group
        ["r0", "r2", "s2", "s3"],             // order 4 — Klein four-group
        ["r0", "r1", "r2", "r3",
         "s0", "s1", "s2", "s3"],            // D4 itself, order 8
    ]
}


function leftCoset(g, subgroup, groupOp){
    return subgroup.map(h => groupOp(g, h))

}


export function cosetPart(groupElm, subgroup, groupOp){
    let remaining = [...groupElm]  
    const cosets = []

    while (remaining.length > 0) {
        const g = remaining[0]                          
        const coset = leftCoset(g, subgroup, groupOp) 
        cosets.push(coset)
        remaining = remaining.filter(x => !coset.includes(x))
    }

    return cosets

}


export function xorAll(pile){
    return pile.reduce((acc, pile) => acc ^ pile, 0)
}

export function toBinar(n, minBits = 4){
     return n.toString(2).padStart(minBits, "0")
}


export function nimOpt(pile){
    const xorSum = xorAll(pile)
    if (xorSum === 0) return null

    for (let i = 0; i < pile.length; i++) {
        const target = pile[i] ^ xorSum   // what this pile should become
        if (target < pile[i]) {            // only valid if we're removing stones
            return {
                pileIndex: i,
                removeAmount: pile[i] - target
            }
        }
    }
}


function buildCayleyTable(element, operation){
    const table = []
    for (let i = 0; i < element.length; i++) {
        const row = []
        for (let j = 0; j < element.length; j++) {
            row.push(operation(element[i], element[j]))
        }
        table.push(row)
    }
    return table
}
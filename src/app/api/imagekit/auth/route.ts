import { imagekit } from "@/lib/imagekit"

import { NextResponse } from "next/server"


export const GET  = async ()=>{
    const authParams = imagekit.getAuthenticationParameters()
    return NextResponse.json(authParams)
}
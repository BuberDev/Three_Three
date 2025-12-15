'use client'

import Image from "next/image"
import Logo from "../../public/logo.png"
export default function ThreeThreeLogo() {

    return (

        <Image src={Logo} alt="Three Three Logo" className="rounded-full" width={48} height={28} />

    )
}
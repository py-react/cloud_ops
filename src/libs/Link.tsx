import React, {useContext, useRef} from 'react'
import { useEffect } from 'react';

import useCustomNavigate from '@/libs/navigate';


function CustomLink(props) {
    const customNavigate = useCustomNavigate();
    // const navigate = useNavigate();
    const ref = useRef(null)

    useEffect(()=>{
        const navigation = function(e){
            e.preventDefault()
            customNavigate(ref.current.href)
        }
        if(ref.current){
            ref.current.addEventListener("click",navigation,null)
        }
        return ()=>{
            if(ref.current){
                ref.current.removeEventListener('click',navigation,null)
            }
        }
    },[])
    return (
        <a ref={ref} {...props} />
    )
}

export default CustomLink
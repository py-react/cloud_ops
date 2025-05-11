import {useEffect,useState} from "react"
import useNavigate from 'src/libs/navigate';
import { useSearchParams } from 'react-router-dom';

export const useLogin = ()=>{
    const navigate = useNavigate()
    const [searchParams] = useSearchParams();
    const [nextUrl, setNextUrl] = useState("/")
  
    function sendPostRequest(url,body) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    
      xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                if (xhr.responseURL !== window.location.href) {
                  navigate(xhr.responseURL)
                } else {
                  navigate("/")
                }
              } else {
                  console.error('Error: ' + xhr.status);
              }
          }
      };
    
      var data = JSON.stringify(body);
      xhr.send(data);
    }
    useEffect(()=>{
      setNextUrl(searchParams.get("next_url")||"/")
    },[searchParams])
  
    const loginHook = (loginType,payload)=>{
      if (loginType === "credentials"){
        sendPostRequest("/oAuth/credentials",payload)
      }else{
        const aTag = document.createElement("a")
        if(loginType === "google"){
          aTag.href = `/oAuth/google?next_url=${nextUrl}` 
        }
        if(loginType === "github"){
          aTag.href = `/oAuth/github?next_url=${nextUrl}` 
        }
        aTag.click()
      }
    }
  
   return [loginHook]
  
  }

export default useLogin
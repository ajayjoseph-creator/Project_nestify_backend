import axios from 'axios';

export const checkEmailExists=async (email)=>{
    try {
        const respose=await axios.get("https://emailvalidation.abstractapi.com/v1/",{
            params:{
                api_key:process.env.ABSTRACT_API_KEY,
                email:email
            }
        })
        return respose.data.deliverability ==='DELIVERABLE';
    } catch (error) {
        console.error('Email validation error:',error.message)
        return false
    }
}
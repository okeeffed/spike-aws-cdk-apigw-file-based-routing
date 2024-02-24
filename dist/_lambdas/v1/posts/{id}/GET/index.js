var a=async e=>({statusCode:200,body:JSON.stringify({message:"Success",pathParam:e.pathParameters,queryParam:e.queryStringParameters})});export{a as handler};

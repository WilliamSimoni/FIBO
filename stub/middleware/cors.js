//middleware to handle CORS problems

function cors(request, response, next){
    response.header("Access-Control-Allow-Origin", '*');
    response.header("Access-Control-Allow-Headers", 
    "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (request.method === 'OPTIONS') {
        response.header('Access-Control-Allow-Methods', 'POST, GET');
        return response.status(200).json({});
    }
    next();
}

exports.cors = cors;
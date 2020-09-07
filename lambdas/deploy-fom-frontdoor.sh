cp fom-frontdoor.py lambda_function.py
zip fom-frontdoor.zip lambda_function.py
rm lambda_function.py
aws lambda update-function-code --function-name fom-frontdoor --zip-file fileb://fom-frontdoor.zip
rm fom-frontdoor.zip

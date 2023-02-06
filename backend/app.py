from flask import Flask, jsonify, request
from flask_restful import Api
from flask_cors import CORS

import pandas as pd

import requests

import wget
import pdfkit
import os




app = Flask(__name__)
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

api = Api(app)


@app.route('/api/generatereport',methods=['POST'])
def hello():
    status = 0
    try:
        file_details = request.get_json(force=True)
        file_id = file_details["id"]
        file_name = file_details["name"]
        URL = "http://127.0.0.1:8090/api/files/file/" + file_id + "/" + file_name
        wget.download(URL, "process.csv")
        df=pd.read_csv('process.csv')
        correlation = df.corr()
        
        correlation.to_html('gen.html')
        path_to_wkhtmltopdf = "D:\\wkhtmltopdf\\bin\\wkhtmltopdf.exe"
        path_to_file = 'gen.html'
        config = pdfkit.configuration(wkhtmltopdf=path_to_wkhtmltopdf)
        pdfkit.from_file(path_to_file, output_path='Generate.pdf', configuration=config)
        URI = "http://127.0.0.1:8090/api/collections/processedfile/records"
        file_to_be_sent = open("Generate.pdf", "rb")
        
        res = requests.post(URI , files={"fileprocessed": file_to_be_sent})
        
            
        
        response_data=res.json()
        status = 1
        file1 = 'process.csv'
        file2 = 'gen.html'
        file3 = 'Generate.pdf'
        location = 'D://React_projects//ml-web//backend'
        path1 = os.path.join(location, file1)
        path2 = os.path.join(location, file2)
        
        os.remove(path1)
        os.remove(path2)
        
        return jsonify(
            body={
                "status": status,
                "id": response_data['id'],
                "name": response_data["fileprocessed"]
            }
        )


    except Exception as e:
        print(f"{e}")
        return jsonify(status)
   
      




if __name__ == '__main__':
    app.run(debug=True, port=5000)
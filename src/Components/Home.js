import React, { useState } from "react";

import PocketBase from "pocketbase";
import Spinner from "./Spinner";
import swal from "sweetalert";

export default function Home() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [url, setUrl] = useState(null);
  const pb = new PocketBase("http://127.0.0.1:8090");

  const handleFileUpload = (event) => {
    setUrl(null);
    setFile(event.target.files[0]);
  };
  const handleRemoveFile = () => {
    document.getElementById("file").value = null;
    setFile(null);
  };
  const handleProcess = () => {
    if (file !== null) {
      setProcessing(!processing);
    }
  };

  const handleReportRequest = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("filetoprocess", file);

    console.log(formData);
    try {
      const createdRecord = await pb.collection("file").create(formData);
      const res = await fetch("http://localhost:5000/api/generatereport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: createdRecord.id,
          name: createdRecord.filetoprocess,
        }),
      });
      const json = await res.json();
      console.log(json.body.id);
      await fetch(
        `http://127.0.0.1:8090/api/files/processedfile/${json.body.id}/${json.body.name}`,
        {
          method: "GET",
        }
      )
        .then((response) => response.blob())
        .then((blob) => {
          const uri = window.URL.createObjectURL(blob);
          setUrl(uri);
        });
      document.getElementById("file").value = null;
      setFile(null);
      await pb.collection("file").delete(createdRecord.id);
      await pb.collection("processedfile").delete(json.body.id);
      swal({
        title: "Success",
        text: "Report has been generated! \n Click on the download button to download it.",
        icon: "success",
      });
      handleProcess();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="container my-4">
        <h4>Upload Your file below:</h4>
        <br />

        <form encType="multipart/form-data" onSubmit={handleReportRequest}>
          <div className="mb-3 ">
            <label htmlFor="file" className="form-label">
              <b>Click below to select your file :</b>
            </label>
            <div className="d-flex">
              <input
                accept=".csv"
                type="file"
                name="file"
                id="file"
                onChange={handleFileUpload}
                required
                className="form-control"
                aria-describedby="emailHelp"
              />
              {file && (
                <div className="my-1 mx-2">
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleRemoveFile}
                  ></button>
                </div>
              )}
            </div>
          </div>
          <div className="d-flex justify-content-center">
            <button
              type="submit"
              className={`btn btn-primary ${processing ? "disabled" : ""}`}
              onClick={handleProcess}
            >
              Generate Report
            </button>
          </div>
        </form>
        <br />
        <br />
        {processing && <Spinner />}
        {url && (
          <>
            <div className="d-flex justify-content-center">
              <a href={url} download="Report.pdf">
                <button type="submit" className="btn btn-outline-success ">
                  Download File
                </button>
              </a>
            </div>
          </>
        )}
        <br />
        <br />
      </div>
    </>
  );
}

import React, { useCallback, useRef, useState } from "react"
import ReactQuill, { Quill } from "react-quill"
import "react-quill/dist/quill.snow.css"
import "quill-mention"
import "quill-mention/dist/quill.mention.css"

import Slider from "./components/Slider"

import axios from "axios"
import store from "store"

import "./App.css"

// Use a customized render of suggestions in text editor
import CustomMentionBlot from "./blots/CustomMentionBlot"
Quill.register(CustomMentionBlot)

const App = () => {
  const [editorContent, setEditorContent] = useState(
    store.get("editorContent", "")
  ) // HTML content of editor, optimized and usable by Quill
  const reactQuillRef = useRef() // Ref access to editor
  const [collapsedSidebar, setCollapsedSidebar] = useState(true)
  const [requestConfig, setRequestConfig] = useState({
    nSamples: 5,
    lengthPrefix: 500,
    length: 24,
    temperature: 1.0,
    topk: 50,
    topp: 0.95,
  })

  const toggleSidebar = () => setCollapsedSidebar(!collapsedSidebar)

  const handleLoadingMentionEvent = useCallback(() => {
    return "טוען..."
  }, [])

  const handleFetchMentionEvent = useCallback(
    async (searchTerm, renderItem) => {
      const editorContentAsText = reactQuillRef.current
        .getEditor()
        .getText()
        .replace(/[\n\r]/g, "")
        .replace(/[‘’\u2018\u2019\u201A]/g, "'") // smart single quotes and apostrophe
        .replace(/[“”\u201C\u201D\u201E]/g, '"') // smart double quotes
        .replace(/\u2026/g, "...") // ellipsis
        .replace(/[\u2013\u2014]/g, "-") // em dashes
        .replace(/\s{2,}/gm, " ") // whitespaces
        .trim() // removes last \n
      const prefix = editorContentAsText.substring(
        Math.max(editorContentAsText.length - requestConfig.lengthPrefix, 0),
        editorContentAsText.length - 1
      )
      axios
        .post("/api/suggest", {
          prefix: prefix,
          nsamples: requestConfig.nSamples,
          length: requestConfig.length,
          temperature: requestConfig.temperature,
          topk: requestConfig.topk,
          topp: requestConfig.topp,
        })
        .then((response) => {
          console.log(JSON.stringify(response))
          const suggestions = response["data"]
          renderItem(suggestions, searchTerm)
        })
        .catch((err) => {
          console.log(JSON.stringify(err))
          alert(err)
        })
    },
    [requestConfig]
  )

  const handleEditorContentEdit = useCallback((content) => {
    store.set("editorContent", content)
    setEditorContent(content)
  }, [])

  const handleInputChange = (event) => {
    setRequestConfig({
      ...requestConfig,
      [event.target.name]: event.target.value,
    })
  }

  const toolbarConfig = [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote", "align"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
      { direction: "rtl" },
    ],
    ["link", "image"],
    ["clean"],
  ]

  const mentionConfig = {
    allowedChars: /^[א-ת0-9A-Za-z\s]*$/,
    mentionDenotationChars: ["@"],
    blotName: "custom_mention",
    fixMentionsToQuill: false,
    spaceAfterInsert: false,
    renderLoading: handleLoadingMentionEvent,
    source: handleFetchMentionEvent,
  }

  const modules = {
    toolbar: toolbarConfig,
    mention: mentionConfig,
  }

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "align",
    "list",
    "bullet",
    "indent",
    "direction",
    "link",
    "image",
    "custom_mention",
  ]

  return (
    <div
      style={{
        display: "grid",
        height: "100vh",
        gridTemplateColumns: `${
          collapsedSidebar ? "0" : "minmax(150px, 10%)"
        } 1fr`,
      }}
    >
      <aside className="sidebar">
        <div
          className="sidebar__content"
          style={{ display: collapsedSidebar ? "none" : "" }}
        >
          <h3 style={{ margin: 0 }}>Configuration</h3>
          <Slider
            label="Number samples:"
            name="nSamples"
            min="1"
            max="50"
            step="1"
            state={requestConfig.nSamples}
            dispatch={handleInputChange}
          />
          <Slider
            label="Length prefix:"
            name="lengthPrefix"
            min="50"
            max="5000"
            step="50"
            state={requestConfig.lengthPrefix}
            dispatch={handleInputChange}
          />
          <Slider
            label="Length samples:"
            name="length"
            min="16"
            max="1024"
            step="16"
            state={requestConfig.length}
            dispatch={handleInputChange}
          />
          <Slider
            label="Temperature:"
            name="temperature"
            min="0"
            max="2"
            step="0.1"
            state={requestConfig.temperature}
            dispatch={handleInputChange}
          />
          <Slider
            label="Top k:"
            name="topk"
            min="0"
            max="5"
            step="1"
            state={requestConfig.topk}
            dispatch={handleInputChange}
          />
          <Slider
            label="Top p:"
            name="topp"
            min="0"
            max="2"
            step="0.1"
            state={requestConfig.topp}
            dispatch={handleInputChange}
          />
          <button className="btn" onClick={() => setEditorContent("")}>
            Clear editor
          </button>
        </div>
        <div className="sidebar__control">
          <button onClick={toggleSidebar}>
            {collapsedSidebar ? `Open Sidebar` : `Close Sidebar`}
          </button>
        </div>
      </aside>
      <main className="container">
        <h1>GPT-2 editor</h1>
        <section>
          <ReactQuill
            ref={reactQuillRef}
            theme="snow"
            placeholder="כתבו פה משהו והשתמשו בסימן @ על מנת לייצר השלמות"
            modules={modules}
            formats={formats}
            value={editorContent}
            onChange={handleEditorContentEdit}
          />
        </section>
      </main>
    </div>
  )
}

export default App

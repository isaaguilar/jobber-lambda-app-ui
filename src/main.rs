use chrono::NaiveDate;
use gloo_console::log;
use gloo_net::http::Request;
use serde::Deserialize;
use web_sys::wasm_bindgen::JsCast;
use web_sys::HtmlElement;
use yew::prelude::*;
use yew_datepicker::Datepicker;
use yew_router::prelude::*;

// const URL: &'static str = "";
const JOBBER_APP_FUNCTION_URL: &'static str = std::env!("JOBBER_APP_FUNCTION_URL");
const JOBBER_OAUTH_HANDLER_FUNCTION_URL: &'static str =
    std::env!("JOBBER_OAUTH_HANDLER_FUNCTION_URL");
const JOBBER_APP_CLIENT_ID: &'static str = std::env!("JOBBER_APP_CLIENT_ID");
const JOBBER_APP_REDIRECT_URI: &'static str = std::env!("JOBBER_APP_REDIRECT_URL");

#[derive(Default, Debug, Clone, Deserialize)]
struct Auth {
    code: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LambdaError {
    error_message: String,
    error_type: String,
}

#[derive(Clone, Routable, PartialEq)]
pub enum Route {
    #[at("/")]
    Homepage,
}

#[function_component(Homepage)]
fn homepage() -> Html {
    let nav = use_navigator().unwrap();
    let loc = use_location().unwrap();

    let code = match loc.query::<Auth>() {
        Ok(s) => s.code,
        Err(_) => String::new(),
    };

    let window = match web_sys::window() {
        Some(w) => w,
        None => {
            log!("Missing window");
            return html! {<>{"Missing window"}</>};
        }
    };

    let before_date_state = use_state(|| String::new());
    let after_date_state = use_state(|| String::new());

    let on_select_before_handler = {
        let before_date_state = before_date_state.clone();
        Callback::from(move |date: NaiveDate| {
            log!("Setting date");
            before_date_state.set(date.format("%d.%m.%Y").to_string());
        })
    };

    let on_select_after_handler = {
        let after_date_state = after_date_state.clone();
        Callback::from(move |date: NaiveDate| {
            after_date_state.set(date.format("%d.%m.%Y").to_string());
        })
    };

    let onclick = {
        let window = window.clone();
        let nav = nav.clone();
        let before_date_state = before_date_state.clone();
        let after_date_state = after_date_state.clone();
        let before = before_date_state.to_string();
        let after = after_date_state.to_string();
        let code = code.clone();
        Callback::from(move |_| {
            let window = window.clone();
            let nav = nav.clone();
            let before = before.clone();
            let after = after.clone();
            let code = code.clone();
            wasm_bindgen_futures::spawn_local(async move {
                let window = window.clone();
                let nav = nav.clone();
                let before = before.clone();
                let after = after.clone();
                let url = format!(
                    "{}/?code={}&client_id={}&redirect_uri={}&state=",
                    JOBBER_OAUTH_HANDLER_FUNCTION_URL,
                    code,
                    JOBBER_APP_CLIENT_ID,
                    JOBBER_APP_REDIRECT_URI
                );
                let response = match Request::post(&url)
                    .header("Content-Type", "text/plain")
                    .body("")
                {
                    Ok(req) => match req.send().await {
                        Ok(resp) => resp,
                        Err(e) => {
                            let _ = window.alert_with_message(&format!(
                                "Failed to execute (send) request: {}",
                                e
                            ));
                            nav.push(&Route::Homepage);
                            return;
                        }
                    },
                    Err(e) => {
                        let _ =
                            window.alert_with_message(&format!("Failed to build request: {}", e));
                        nav.push(&Route::Homepage);
                        return;
                    }
                };

                let s = match response.text().await {
                    Ok(s) => s,
                    Err(e) => {
                        let _ =
                            window.alert_with_message(&format!("Failed to read response: {}", e));
                        nav.push(&Route::Homepage);
                        return;
                    }
                };

                if response.status() != 200 {
                    // Lets see if we can parse out the errorMessage
                    match serde_json::from_str::<LambdaError>(&s) {
                        Ok(value) => {
                            let _ = window
                                .alert_with_message(&format!("Error: {}", value.error_message));
                            return;
                        }
                        Err(_) => {
                            let _ = window.alert_with_message(&format!("Error: {}", s));
                            nav.push(&Route::Homepage);
                            return;
                        }
                    }
                }

                let url = format!(
                    "{}?code={}&before={}&after={}",
                    JOBBER_APP_FUNCTION_URL, code, before, after
                );

                let response = match Request::post(&url)
                    .header("Content-Type", "text/plain")
                    .body("")
                {
                    Ok(req) => match req.send().await {
                        Ok(resp) => resp,
                        Err(e) => {
                            let _ = window.alert_with_message(&format!(
                                "Failed to execute (send) request: {}",
                                e
                            ));
                            nav.push(&Route::Homepage);
                            return;
                        }
                    },
                    Err(e) => {
                        let _ =
                            window.alert_with_message(&format!("Failed to build request: {}", e));
                        nav.push(&Route::Homepage);
                        return;
                    }
                };

                let s = match response.text().await {
                    Ok(s) => s,
                    Err(e) => {
                        let _ =
                            window.alert_with_message(&format!("Failed to read response: {}", e));
                        nav.push(&Route::Homepage);
                        return;
                    }
                };

                if response.status() != 200 {
                    // Lets see if we can parse out the errorMessage
                    match serde_json::from_str::<LambdaError>(&s) {
                        Ok(value) => {
                            let _ = window
                                .alert_with_message(&format!("Error: {}", value.error_message));
                            nav.push(&Route::Homepage);
                            return;
                        }
                        Err(_) => {
                            let _ = window.alert_with_message(&format!("Error: {}", s));
                            nav.push(&Route::Homepage);
                            return;
                        }
                    }
                }

                let json_jsvalue = wasm_bindgen::JsValue::from_str(&s);
                let json_jsvalue_array = js_sys::Array::from_iter(std::iter::once(json_jsvalue));
                let blob = web_sys::Blob::new_with_str_sequence(&json_jsvalue_array).unwrap();

                let url = match web_sys::Url::create_object_url_with_blob(&blob) {
                    Ok(url) => url,
                    Err(_) => {
                        log!("Failed to create download link");

                        let _ = window.alert_with_message(&format!(
                            "Failed to save response (couldn't setup url)",
                        ));

                        return;
                    }
                };

                let a: HtmlElement = web_sys::window()
                    .unwrap()
                    .document()
                    .unwrap()
                    .create_element("a")
                    .unwrap()
                    .dyn_into()
                    .unwrap();

                let _a = match a.set_attribute("href", &url) {
                    Ok(_) => {}
                    Err(_) => {
                        log!("Failed to set download link");

                        let _ = window.alert_with_message(&format!(
                            "Failed to save response (couldn't get download url)",
                        ));

                        return;
                    }
                };
                let _b = match a.set_attribute("download", "output.csv") {
                    Ok(_) => {}
                    Err(_) => {
                        log!("Failed to set download filename");

                        let _ = window.alert_with_message(&format!(
                            "Failed to save response (couldn't set filename)",
                        ));

                        return;
                    }
                };

                a.click();

                // Clean up the URL
                let _ = web_sys::Url::revoke_object_url(&url);
            })
        })
    };

    let connect_url = format!(
        "https://api.getjobber.com/api/oauth/authorize?response_type=code&client_id={}&redirect_uri={}&state=", 
        JOBBER_APP_CLIENT_ID, 
        JOBBER_APP_REDIRECT_URI
    );

    let connect = if code == String::new() {
        html! {
            <div>
                <a href={connect_url}>
                    <button class="btn btn-primary">
                        {"Connect"}
                    </button>
                </a>
            </div>
        }
    } else {
        html! {
            <>
                <p>
                    {"Connected!"}
                </p>
                <div class="row">
                    <div class="col text-center">
                        <p>{"Select start date"}</p>
                        <Datepicker on_select={on_select_after_handler} />
                    </div>
                    <div class="col text-center">
                        <p>{"Select end date"}</p>
                        <Datepicker on_select={on_select_before_handler} />
                    </div>
                </div>
                <hr/>
                <button class="btn btn-primary" onclick={onclick} >{"Download"}</button>
                <br />
            </>
        }
    };

    html! {
        <>
            {connect}
        </>
    }
}

pub fn switch(routes: Route) -> Html {
    match routes {
        Route::Homepage => html! {
            <div>
                <Homepage />
            </div>
        },
    }
}

#[function_component(App)]
fn app() -> Html {
    html! {
        <BrowserRouter>
            <Switch<Route> render={switch} /> // <- must be child of <BrowserRouter>
        </BrowserRouter>
    }
}

fn main() {
    yew::Renderer::<App>::new().render();
}

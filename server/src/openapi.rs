use crate::routes::CoreApiDoc;
use crate::routes::callbacks::CallbackApiDoc;

pub struct ApiDoc;

impl utoipa::OpenApi for ApiDoc {
    fn openapi() -> utoipa::openapi::OpenApi {
        let mut openapi = CoreApiDoc::openapi();
        openapi.merge(CallbackApiDoc::openapi());
        openapi
    }
}

use clap::{Parser, ValueEnum};
use utoipa::OpenApi;

use std::fs;

#[derive(Copy, Clone, Debug, ValueEnum)]
enum OutputFormat {
    Yaml,
    Json,
}

#[derive(Parser, Clone)]
#[command(
    name = "OpenAPI Spec Generator",
    version = "0.1.0",
    about = "Generate OpenAPI specification for the CoreLightning REST server"
)]
struct Args {
    /// Output format.
    #[arg(
        short,
        long,
        value_enum,
        default_value_t = OutputFormat::Yaml,
        help = "Output format (Yaml or Json)"
    )]
    format: OutputFormat,

    /// Output file path. If omitted, prints to stdout.
    #[arg(short, long, help = "Output file path. If omitted, prints to stdout.")]
    output: Option<String>,
}

fn main() {
    let args = Args::parse();
    let spec = ln_server::openapi::ApiDoc::openapi();

    let output = match args.format {
        OutputFormat::Yaml => serde_yaml::to_string(&spec).expect("serialize OpenAPI to YAML"),
        OutputFormat::Json => {
            serde_json::to_string_pretty(&spec).expect("serialize OpenAPI to JSON")
        }
    };

    match args.output {
        Some(ref out_path) => {
            fs::write(out_path, output).expect("write OpenAPI file");
        }
        None => print!("{}", output),
    }
}

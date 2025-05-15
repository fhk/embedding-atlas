# /// script
# requires-python = ">=3.11"
# dependencies = ["click", "datasets", "pandas", "sentence-transformers", "umap-learn"]
# ///

import json
import os
import shutil

import click
import numpy as np
import pandas as pd
from datasets import load_dataset
from sentence_transformers import SentenceTransformer
from umap import UMAP
from umap.umap_ import nearest_neighbors


def add_embedding_projection(df: pd.DataFrame, text: str):
    texts = list(df[text])

    transformer = SentenceTransformer("all-MiniLM-L6-v2")
    hidden_vectors = transformer.encode(texts, show_progress_bar=True)

    random_state = np.random.RandomState(42)

    knn = nearest_neighbors(
        hidden_vectors,
        n_neighbors=15,
        metric="cosine",
        metric_kwds=None,
        angular=False,
        random_state=random_state,
    )

    proj = UMAP(
        metric="cosine", precomputed_knn=knn, random_state=random_state
    ).fit_transform(hidden_vectors)

    df["projection_x"] = proj[:, 0]  # type: ignore
    df["projection_y"] = proj[:, 1]  # type: ignore
    df["__neighbors"] = [{"distances": b, "ids": a} for a, b in zip(knn[0], knn[1])]


@click.command()
@click.option("--output", default="demo-data")
def main(output: str):
    shutil.rmtree(output, ignore_errors=True)
    os.makedirs(output, exist_ok=True)

    name = "spawn99/wine-reviews"
    columns = [
        "title",
        "country",
        "province",
        "description",
        "points",
        "price",
        "variety",
        "designation",
    ]

    ds = load_dataset(name, split="train")
    df = ds.to_pandas()[columns]  # type: ignore
    df["_row_index"] = range(len(df))

    add_embedding_projection(df, text="description")

    df.to_parquet(os.path.join(output, "dataset.parquet"), index=False)

    metadata = {
        "columns": {
            "id": "_row_index",
            "text": "description",
            "embedding": {"x": "projection_x", "y": "projection_y"},
            "neighbors": "__neighbors",
        },
        "is_static": True,
        "database": {"type": "wasm", "load": True},
    }

    with open(os.path.join(output, "metadata.json"), "wb") as f:
        f.write(json.dumps(metadata).encode("utf-8"))


if __name__ == "__main__":
    main()

from sentence_transformers import SentenceTransformer

def main():
    print("Loading the sentence embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("✅ Model loaded. You can now generate vectors for your queries.")

    while True:
        user_sentence = input("\nEnter your query sentence (or type 'quit' to exit): ")
        if user_sentence.lower() in ['quit', 'exit']:
            print("Exiting the program. Goodbye!")
            break
        embedding_vector = model.encode(user_sentence).tolist()
        print("------------------------------------------------------------------")
        print(embedding_vector)
        print("------------------------------------------------------------------")
if __name__ == "__main__":
    main()
import Navbar from "@/app/navbar"

function clickHandler(e) {
  setName(e.target.value)
}

export default async function ItemPage({
    params,
}) {
    const { slug } = await params
    return (
        <div className="">

            <Navbar />
            <form>
                <div className="mx-4 mt-4">
                    <fieldset id="cup">
                        <p className="font-bold">Cup Size</p>
                        <label className="flex bg-gray-100 rounded-md px-3 py-4 my-3 hover:bg-indigo-300 cursor-pointer ">
                            <input type="radio" name="cup" value="small" defaultChecked />
                            <p className="pl-4">Small Cup</p>
                        </label>

                        <label className="flex bg-gray-100 rounded-md px-3 py-4 my-3  hover:bg-indigo-300 cursor-pointer ">
                            <input type="radio" name="cup" value="large" />
                            <p className="pl-4">Large Cup</p>
                        </label>
                    </fieldset>
                </div>

                <div className="mx-4 mt-8">
                    <fieldset id="milk">
                        <p className="font-bold">Milk</p>
                        <label className="flex bg-gray-100 rounded-md px-3 py-4 my-3  hover:bg-indigo-300 cursor-pointer ">
                            <input type="radio" name="milk" value="Semi-skimmed" defaultChecked />
                            <p className="pl-4">Semi-skimmed</p>
                        </label>

                        <label className="flex bg-gray-100 rounded-md px-3 py-4 my-3  hover:bg-indigo-300 cursor-pointer ">
                            <input type="radio" name="milk" value="Skimmed" />
                            <p className="pl-4">Skimmed</p>
                        </label>

                        <label className="flex bg-gray-100 rounded-md px-3 py-4 my-3  hover:bg-indigo-300 cursor-pointer ">
                            <input type="radio" name="milk" value="Oat" />
                            <p className="pl-4">Oat</p>
                        </label>

                        <label className="flex bg-gray-100 rounded-md px-3 py-4 my-3  hover:bg-indigo-300 cursor-pointer ">
                            <input type="radio" name="milk" value="Soya" />
                            <p className="pl-4">Soya</p>
                        </label>
                    </fieldset>
                </div>
            </form>
        </div>
    )
}